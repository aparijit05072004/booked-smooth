import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import CreateShowForm from '@/components/admin/CreateShowForm';
import AdminShowList from '@/components/admin/AdminShowList';
import { ArrowLeft, Shield } from 'lucide-react';

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="border-2 border-foreground p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - TicketFlow</title>
        <meta name="description" content="Manage shows, trips, and events." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shows
          </Link>

          <h1 className="text-3xl font-bold uppercase mb-8 flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            <CreateShowForm />
            <AdminShowList />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Admin;
