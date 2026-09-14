
-- Pin messages table
CREATE TABLE public.pin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  destination text NOT NULL,
  message text NOT NULL DEFAULT 'Heading your way!',
  driver_lat double precision NOT NULL,
  driver_lng double precision NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Pin responses table
CREATE TABLE public.pin_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_message_id uuid NOT NULL REFERENCES public.pin_messages(id) ON DELETE CASCADE,
  commuter_id uuid NOT NULL,
  response text NOT NULL CHECK (response IN ('yes', 'no')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(pin_message_id, commuter_id)
);

-- Enable RLS
ALTER TABLE public.pin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_responses ENABLE ROW LEVEL SECURITY;

-- Pin messages policies
CREATE POLICY "Drivers can insert pin messages" ON public.pin_messages
  FOR INSERT WITH CHECK (auth.uid() = driver_id AND has_role(auth.uid(), 'driver'::app_role));

CREATE POLICY "Drivers can view their own pin messages" ON public.pin_messages
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Commuters can view active pin messages for their destination" ON public.pin_messages
  FOR SELECT USING (
    is_active = true 
    AND has_role(auth.uid(), 'commuter'::app_role)
  );

CREATE POLICY "Drivers can update their own pin messages" ON public.pin_messages
  FOR UPDATE USING (auth.uid() = driver_id);

-- Pin responses policies
CREATE POLICY "Commuters can insert their response" ON public.pin_responses
  FOR INSERT WITH CHECK (auth.uid() = commuter_id AND has_role(auth.uid(), 'commuter'::app_role));

CREATE POLICY "Commuters can view their own responses" ON public.pin_responses
  FOR SELECT USING (auth.uid() = commuter_id);

CREATE POLICY "Drivers can view responses to their pins" ON public.pin_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pin_messages pm 
      WHERE pm.id = pin_message_id AND pm.driver_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pin_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pin_responses;
