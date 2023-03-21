import { render, screen, fireEvent } from '@testing-library/react';
import { getActiveElement } from '@testing-library/user-event/dist/utils';
import App from './App';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

describe(DeviceLink, () => {
  it("Shows Modal on Link Button Click", () => {
    const { getByRole } = render(<App></App>);
    const linkBtn = getByRole("button", {name: "Link"});
    fireEvent.click(linkBtn);
    const modalContainer = get
    expect()
  });
});
