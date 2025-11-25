/** Error component tests */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Error from '../Error';

describe('Error', () => {
  it('should render error message', () => {
    render(<Error message="테스트 에러 메시지" />);
    expect(screen.getByText('테스트 에러 메시지')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<Error message="에러" onRetry={onRetry} />);
    const retryButton = screen.getByText('다시 시도');
    expect(retryButton).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<Error message="에러" />);
    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(<Error message="에러" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('다시 시도');
    await user.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

