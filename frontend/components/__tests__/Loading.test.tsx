/** Loading component tests */

import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading', () => {
  it('should render loading spinner', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

