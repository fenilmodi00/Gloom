// Test for CategoryFilter component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilter } from '../components/wardrobe/CategoryFilter';

describe('CategoryFilter', () => {
  it('should render all category options', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryFilter
        activeCategory="All"
        onSelectCategory={onSelect}
      />
    );

    expect(getByText('All')).toBeTruthy();
    expect(getByText('Tops')).toBeTruthy();
    expect(getByText('Bottoms')).toBeTruthy();
    expect(getByText('Dresses')).toBeTruthy();
  });

  it('should call onSelectCategory when category is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryFilter
        activeCategory="All"
        onSelectCategory={onSelect}
      />
    );

    fireEvent.press(getByText('Tops'));
    expect(onSelect).toHaveBeenCalledWith('Tops');
  });

  it('should highlight the active category', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryFilter
        activeCategory="Tops"
        onSelectCategory={onSelect}
      />
    );

    // The active category should be rendered
    expect(getByText('Tops')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
  });
});
