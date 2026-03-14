// Test for CategoryFilter component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilter } from '../components/wardrobe/CategoryFilter';
import type { Category } from '../types/wardrobe';

describe('CategoryFilter', () => {
  const categories: Category[] = ['upper', 'lower', 'dress', 'shoes', 'bag', 'accessory'];
  
  it('should render all category options', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryFilter
        categories={categories}
        selectedCategory="all"
        onSelect={onSelect}
      />
    );

    expect(getByText('All')).toBeTruthy();
    expect(getByText('Tops')).toBeTruthy();
    expect(getByText('Bottoms')).toBeTruthy();
    expect(getByText('Dresses')).toBeTruthy();
  });

  it('should call onSelect when category is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryFilter
        categories={categories}
        selectedCategory="all"
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByText('Tops'));
    expect(onSelect).toHaveBeenCalledWith('upper');
  });

  it('should display counts when provided', () => {
    const onSelect = jest.fn();
    const counts = {
      all: 10,
      upper: 5,
      lower: 3,
      dress: 2,
      shoes: 0,
      bag: 0,
      accessory: 0,
    };
    
    const { getByText } = render(
      <CategoryFilter
        categories={categories}
        selectedCategory="all"
        onSelect={onSelect}
        counts={counts}
      />
    );

    expect(getByText('All (10)')).toBeTruthy();
    expect(getByText('Tops (5)')).toBeTruthy();
  });
});
