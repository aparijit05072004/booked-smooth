import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useShows } from '@/contexts/ShowsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

const createShowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  startTime: z.string().min(1, 'Start time is required'),
  totalSeats: z
    .number({ invalid_type_error: 'Total seats must be a number' })
    .min(1, 'Must have at least 1 seat')
    .max(500, 'Maximum 500 seats allowed'),
});

type CreateShowFormData = z.infer<typeof createShowSchema>;

const CreateShowForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchShows } = useShows();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateShowFormData>({
    resolver: zodResolver(createShowSchema),
    defaultValues: {
      name: '',
      startTime: '',
      totalSeats: 40,
    },
  });

  const onSubmit = async (data: CreateShowFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_show_with_seats', {
        p_name: data.name,
        p_start_time: new Date(data.startTime).toISOString(),
        p_total_seats: data.totalSeats,
      });

      if (error) throw error;

      toast({
        title: 'Show created successfully',
        description: `${data.name} has been added with ${data.totalSeats} seats.`,
      });

      reset();
      await refetchShows();
    } catch (err) {
      console.error('Error creating show:', err);
      toast({
        title: 'Failed to create show',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Show
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Show / Bus / Event Name</Label>
            <Input
              id="name"
              placeholder="e.g., Avengers: Endgame, Delhi Express"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              className={errors.startTime ? 'border-destructive' : ''}
            />
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalSeats">Total Seats</Label>
            <Input
              id="totalSeats"
              type="number"
              min={1}
              max={500}
              {...register('totalSeats', { valueAsNumber: true })}
              className={errors.totalSeats ? 'border-destructive' : ''}
            />
            {errors.totalSeats && (
              <p className="text-sm text-destructive">{errors.totalSeats.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Show
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateShowForm;
