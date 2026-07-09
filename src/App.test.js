import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/containers/DeviceInfoContainer', () => () => <div>Device Info Panel</div>);
jest.mock('./components/containers/ServersInfoContainer', () => () => <div>Servers Panel</div>);
jest.mock('./components/containers/SystemStatusContainer', () => () => <div>System Status Panel</div>);
jest.mock('./components/containers/DeviceHealthContainer', () => () => <div>Device Health Panel</div>);
jest.mock('./components/containers/RecoveryContainer', () => () => <div>Recovery Panel</div>);

describe('App shell navigation', () => {
  it('shows setup view by default', () => {
    render(<App />);

    expect(screen.getByText('Device Info Panel')).toBeInTheDocument();
    expect(screen.getByText('Servers Panel')).toBeInTheDocument();
    expect(screen.queryByText('System Status Panel')).not.toBeInTheDocument();
  });

  it('switches to status view when Status tab is clicked', async () => {
    render(<App />);

    const statusTab = screen.getByRole('tab', { name: /status/i });
    fireEvent.click(statusTab);

    expect(screen.getByText('System Status Panel')).toBeInTheDocument();
    expect(screen.getByText('Recovery Panel')).toBeInTheDocument();
    expect(screen.getByText('Device Health Panel')).toBeInTheDocument();
    expect(screen.queryByText('Device Info Panel')).not.toBeInTheDocument();
  });
});
