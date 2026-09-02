"""
PyTorch Dataset and DataLoader utilities for Dorsal Hand Age Regression.

This module provides:
- DorsalHandDataset: Custom PyTorch Dataset class
- get_transforms(): Separate transforms for train/val/test
- create_dataloaders(): Utility to create train/val/test DataLoaders
"""

import os
from pathlib import Path
from typing import Tuple, Optional, Dict

import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np


class DorsalHandDataset(Dataset):
    """
    PyTorch Dataset for dorsal hand images with age labels.
    
    This dataset loads hand images and their corresponding ages as continuous
    regression targets. Images are resized to a standard size and normalized
    for use with ImageNet-pretrained models.
    
    Args:
        df (pd.DataFrame): DataFrame containing 'imageName' and 'age' columns.
        image_dir (str or Path): Path to directory containing hand images.
        transform (transforms.Compose, optional): Image transformations to apply.
        device (str): Device to use ('cpu' or 'cuda'). Default: 'cpu'.
    
    Returns:
        Tuple[torch.Tensor, torch.Tensor]: (image_tensor, age_tensor)
            - image_tensor: Shape (3, H, W), normalized for ImageNet
            - age_tensor: Shape (1,), age as float32
    """
    
    def __init__(
        self,
        df: pd.DataFrame,
        image_dir: str,
        transform: Optional[transforms.Compose] = None,
        device: str = 'cpu'
    ):
        """Initialize the dataset."""
        self.df = df.reset_index(drop=True)
        self.image_dir = Path(image_dir)
        self.transform = transform
        self.device = device
        
        # Verify that required columns exist
        if 'imageName' not in df.columns or 'age' not in df.columns:
            raise ValueError("DataFrame must contain 'imageName' and 'age' columns")
    
    def __len__(self) -> int:
        """Return the total number of samples."""
        return len(self.df)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Load and return a single sample.
        
        Args:
            idx (int): Index of the sample to load.
        
        Returns:
            Tuple containing:
            - image (torch.Tensor): Image tensor, shape (3, H, W)
            - age (torch.Tensor): Age as float tensor, shape (1,)
        
        Raises:
            FileNotFoundError: If image file does not exist.
            IOError: If image cannot be loaded or decoded.
        """
        # Get image filename and age from dataframe
        row = self.df.iloc[idx]
        image_name = row['imageName']
        age = float(row['age'])
        
        # Construct full path to image
        image_path = self.image_dir / image_name
        
        # Check if image exists
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # Try to load and convert image
        try:
            image = Image.open(image_path)
            # Ensure image is in RGB format (convert from grayscale or RGBA if needed)
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            raise IOError(f"Failed to load image {image_path}: {str(e)}")
        
        # Apply transformations if provided
        if self.transform:
            image = self.transform(image)
        
        # Convert age to float32 tensor with shape (1,)
        age_tensor = torch.tensor([age], dtype=torch.float32)
        
        return image, age_tensor


def get_transforms(image_size: int = 224) -> Dict[str, transforms.Compose]:
    """
    Create separate image transformation pipelines for train/val/test.
    
    Training transforms include:
    - Resize to (image_size, image_size)
    - Random horizontal flip (realistic for symmetric hand images)
    - Random rotation ±15 degrees (mild, preserves aging features)
    - Normalization with ImageNet statistics
    
    Validation/Test transforms include:
    - Resize to (image_size, image_size)
    - Center crop to (image_size, image_size)
    - Normalization with ImageNet statistics
    
    Args:
        image_size (int): Target image size (height=width). Default: 224 (ResNet standard).
    
    Returns:
        Dict[str, transforms.Compose]: Dictionary with 'train' and 'val' transform pipelines.
    """
    
    # ImageNet normalization statistics (standard for pretrained models)
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]
    
    # Training transforms: includes augmentation
    train_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(p=0.5),  # Hands are roughly symmetric
        transforms.RandomRotation(degrees=15),    # Mild rotation, preserves hand features
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])
    
    # Validation/Test transforms: no random augmentation
    val_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.CenterCrop((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])
    
    return {'train': train_transform, 'val': val_transform}


def create_dataloaders(
    train_csv_path: str,
    val_csv_path: str,
    test_csv_path: str,
    image_dir: str,
    batch_size: int = 16,
    num_workers: int = 4,
    device: str = 'cpu',
    image_size: int = 224
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create DataLoaders for train, validation, and test sets.
    
    This function:
    1. Loads the train/val/test CSV files
    2. Creates DorsalHandDataset instances with appropriate transforms
    3. Creates DataLoaders with specified batch size and number of workers
    
    Args:
        train_csv_path (str): Path to train.csv
        val_csv_path (str): Path to val.csv
        test_csv_path (str): Path to test.csv
        image_dir (str): Path to directory containing hand images
        batch_size (int): Batch size for DataLoaders. Default: 16 (suitable for ~4GB VRAM).
        num_workers (int): Number of worker processes for data loading. Default: 4.
        device (str): Device to use ('cpu' or 'cuda'). Default: 'cpu'.
        image_size (int): Target image size. Default: 224.
    
    Returns:
        Tuple[DataLoader, DataLoader, DataLoader]:
        - train_loader: DataLoader for training data (shuffled)
        - val_loader: DataLoader for validation data (not shuffled)
        - test_loader: DataLoader for test data (not shuffled)
    
    Raises:
        FileNotFoundError: If CSV files or image directory do not exist.
    """
    
    # Verify paths exist
    for csv_path in [train_csv_path, val_csv_path, test_csv_path]:
        if not Path(csv_path).exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    if not Path(image_dir).exists():
        raise FileNotFoundError(f"Image directory not found: {image_dir}")
    
    # Get transforms
    transforms_dict = get_transforms(image_size=image_size)
    train_transform = transforms_dict['train']
    val_transform = transforms_dict['val']
    
    # Load CSV files
    train_df = pd.read_csv(train_csv_path)
    val_df = pd.read_csv(val_csv_path)
    test_df = pd.read_csv(test_csv_path)
    
    print(f"Loaded datasets:")
    print(f"  Train: {len(train_df)} images")
    print(f"  Val: {len(val_df)} images")
    print(f"  Test: {len(test_df)} images")
    
    # Create datasets
    train_dataset = DorsalHandDataset(
        df=train_df,
        image_dir=image_dir,
        transform=train_transform,
        device=device
    )
    
    val_dataset = DorsalHandDataset(
        df=val_df,
        image_dir=image_dir,
        transform=val_transform,
        device=device
    )
    
    test_dataset = DorsalHandDataset(
        df=test_df,
        image_dir=image_dir,
        transform=val_transform,  # Same as val: no augmentation
        device=device
    )
    
    # Create DataLoaders
    # Training: shuffle=True for better training
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=(device == 'cuda')
    )
    
    # Validation: shuffle=False for consistent evaluation
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=(device == 'cuda')
    )
    
    # Test: shuffle=False for consistent evaluation
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=(device == 'cuda')
    )
    
    return train_loader, val_loader, test_loader
