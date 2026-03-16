// Test for EmptyState component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../components/shared';

describe('EmptyState', () => {
  it('renders title and description', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        description="Test Description"
        onPress={onPress}
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('renders default button title', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        description="Test Description"
        onPress={onPress}
      />
    );

    expect(getByText('Add item')).toBeTruthy();
  });

  it('renders custom button title', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        description="Test Description"
        buttonTitle="Custom Action"
        onPress={onPress}
      />
    );

    expect(getByText('Custom Action')).toBeTruthy();
  });

  it('calls onPress when primary button is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        description="Test Description"
        onPress={onPress}
      />
    );

    fireEvent.press(getByText('Add item'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
