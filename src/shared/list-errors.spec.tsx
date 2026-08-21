import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './list-errors';

describe('ListErrors', () => {
  it('renders each error as "${key} ${value}"', () => {
    render(
      <ListErrors
        errors={{
          errors: {
            email: ["can't be blank"],
            username: 'is taken',
          },
        }}
      />,
    );

    expect(screen.getByText("email can't be blank")).toBeTruthy();
    expect(screen.getByText('username is taken')).toBeTruthy();
  });

  it('renders an empty list when there are no errors', () => {
    const { container } = render(<ListErrors errors={{ errors: {} }} />);
    expect(container.querySelector('.error-messages')).toBeTruthy();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});
