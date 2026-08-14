import { Outlet } from 'react-router';
import { Footer } from './footer';
import { Header } from './header';

export function AppShell() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
