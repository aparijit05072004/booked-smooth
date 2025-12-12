import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, User, LogOut, Shield } from 'lucide-react';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Ticket className="h-8 w-8" />
            <span className="text-xl font-bold uppercase tracking-tight">TicketFlow</span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/my-bookings">
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
