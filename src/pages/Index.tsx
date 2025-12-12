import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import ShowList from '@/components/shows/ShowList';
import { Ticket } from 'lucide-react';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>TicketFlow - Book Shows, Buses & Events</title>
        <meta
          name="description"
          content="Book tickets for movies, shows, buses, and events. Fast, secure booking with real-time seat selection."
        />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Ticket className="h-12 w-12" />
              <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">
                TicketFlow
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book tickets for movies, shows, buses, and events. Fast, secure booking with
              real-time seat selection.
            </p>
          </section>

          {/* Shows Grid */}
          <section>
            <h2 className="text-2xl font-bold uppercase mb-6 border-b-2 border-foreground pb-2">
              Available Shows & Events
            </h2>
            <ShowList />
          </section>
        </div>
      </Layout>
    </>
  );
};

export default Index;
