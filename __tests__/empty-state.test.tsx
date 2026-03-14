// Test for EmptyState component
import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../components/shared';

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with undefined subtitle', () => {
    const { getByText } = render(
      <EmptyState
        title="Test Title"
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(() => render(<EmptyState title="Test Title" />)).not.toThrow();
  });

  it('renders action buttons when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        subtitle="Test Subtitle"
        actions={[
          { label: 'Action 1', onPress },
          { label: 'Action 2', onPress },
        ]}
      />
    );

    expect(getByText('Action 1')).toBeTruthy();
    expect(getByText('Action 2')).toBeTruthy();
  });
});
