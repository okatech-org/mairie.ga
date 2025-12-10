import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, isSameDay, setHours, setMinutes, isAfter, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MapPin, Building2, ArrowLeft, Navigation, Check, Loader2, ExternalLink, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/services/organizationService';
import { appointmentService } from '@/services/appointmentService';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  processing_time_days: number | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const WORKING_HOURS = {
  start: 8,
  end: 16,
  lunchStart: 12,
  lunchEnd: 13,
  slotDuration: 30
};

const AppointmentBookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const organizationId = searchParams.get('organization');
  const serviceId = searchParams.get('service');
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(serviceId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Contact info for unauth users
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Fetch organization and services
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;
        setOrganization(org);

        // Fetch services for this organization
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('name');

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // If serviceId provided, set it
        if (serviceId) {
          const foundService = servicesData?.find(s => s.id === serviceId);
          if (foundService) {
            setService(foundService);
            setSelectedService(foundService.id);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, serviceId]);

  // Fetch existing appointments when date changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDate || !organizationId) return;

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_date, status')
          .eq('organization_id', organizationId)
          .gte('appointment_date', `${dateStr}T00:00:00`)
          .lte('appointment_date', `${dateStr}T23:59:59`)
          .neq('status', 'CANCELLED');

        if (error) throw error;
        setExistingAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };

    fetchAppointments();
  }, [selectedDate, organizationId]);

  // Generate available time slots
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      // Skip lunch break
      if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) continue;

      for (let minute = 0; minute < 60; minute += WORKING_HOURS.slotDuration) {
        const slotTime = setMinutes(setHours(selectedDate, hour), minute);
        const timeStr = format(slotTime, 'HH:mm');

        // Check if slot is in the past (for today)
        if (isToday && !isAfter(slotTime, now)) {
          slots.push({ time: timeStr, available: false });
          continue;
        }

        // Check if slot is already booked
        const isBooked = existingAppointments.some(apt => {
          const aptTime = new Date(apt.appointment_date);
          return format(aptTime, 'HH:mm') === timeStr;
        });

        slots.push({ time: timeStr, available: !isBooked });
      }
    }

    return slots;
  }, [selectedDate, existingAppointments]);

  // Disabled dates (weekends and past dates)
  const disabledDays = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6 || date < startOfDay(new Date());
  };

  // Handle GPS navigation
  const handleNavigate = (app: 'google' | 'waze') => {
    if (!organization?.latitude || !organization?.longitude) {
      toast.error('Coordonnées GPS non disponibles');
      return;
    }

    const { latitude, longitude } = organization;

    if (app === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
    } else {
      window.open(`https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`, '_blank');
    }
  };

  // Submit appointment
  const handleSubmit = async () => {
    if (!organizationId || !selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email) {
      toast.error('Veuillez remplir vos informations de contact');
      return;
    }

    setSubmitting(true);

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const citizenId = user?.id || crypto.randomUUID();

      // Create appointment date
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const appointmentDate = setMinutes(setHours(selectedDate, hours), minutes);

      // Create appointment
      const appointment = await appointmentService.create({
        organization_id: organizationId,
        service_id: selectedService,
        citizen_id: citizenId,
        appointment_date: appointmentDate.toISOString(),
        status: 'SCHEDULED',
        notes: contactInfo.notes || null,
        duration_minutes: WORKING_HOURS.slotDuration,
        agent_id: null,
        request_id: null
      });

      // Send confirmation email
      try {
        const selectedServiceData = services.find(s => s.id === selectedService);
        await supabase.functions.invoke('send-appointment-confirmation', {
          body: {
            to: contactInfo.email,
            firstName: contactInfo.firstName,
            lastName: contactInfo.lastName,
            organizationName: organization?.name,
            serviceName: selectedServiceData?.name,
            appointmentDate: format(appointmentDate, 'EEEE d MMMM yyyy', { locale: fr }),
            appointmentTime: selectedTimeSlot,
            organizationAddress: organization?.address,
            organizationPhone: organization?.contact_phone
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole process if email fails
      }

      toast.success('Rendez-vous confirmé !', {
        description: `${format(appointmentDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}`
      });

      setStep(4); // Success step
    } catch (err) {
      console.error('Error creating appointment:', err);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizationId || !organization) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucune mairie sélectionnée</h2>
              <p className="text-muted-foreground mb-6">
                Veuillez sélectionner une mairie depuis la carte pour prendre rendez-vous.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la carte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Prise de rendez-vous</h1>
              <p className="text-muted-foreground mt-1">{organization.name}</p>
            </div>
            
            {/* GPS Navigation */}
            {organization.latitude && organization.longitude && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleNavigate('google')}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Google Maps
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleNavigate('waze')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Waze
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-16 md:w-24 h-1 mx-2",
                  step > s ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Choisir un service
              </CardTitle>
              <CardDescription>
                Sélectionnez le service pour lequel vous souhaitez prendre rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun service disponible pour cette mairie
                </p>
              ) : (
                <div className="grid gap-3">
                  {services.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setSelectedService(srv.id);
                        setService(srv);
                      }}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all",
                        selectedService === srv.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{srv.name}</h3>
                          {srv.description && (
                            <p className="text-sm text-muted-foreground mt-1">{srv.description}</p>
                          )}
                          {srv.category && (
                            <Badge variant="secondary" className="mt-2">{srv.category}</Badge>
                          )}
                        </div>
                        {srv.price !== null && srv.price > 0 && (
                          <span className="font-semibold text-primary">
                            {srv.price.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setStep(2)} disabled={!selectedService}>
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Date et heure
              </CardTitle>
              <CardDescription>
                Choisissez la date et l'heure de votre rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <Label className="mb-2 block">Date du rendez-vous</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTimeSlot(null);
                    }}
                    disabled={disabledDays}
                    locale={fr}
                    className="rounded-md border pointer-events-auto"
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 60)}
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="mb-2 block">Créneau horaire</Label>
                  {!selectedDate ? (
                    <p className="text-muted-foreground text-center py-8">
                      Sélectionnez d'abord une date
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto p-1">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTimeSlot(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "p-3 rounded-md text-sm font-medium transition-all",
                            !slot.available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                            slot.available && selectedTimeSlot === slot.time && "bg-primary text-primary-foreground",
                            slot.available && selectedTimeSlot !== slot.time && "bg-muted hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          <Clock className="h-3 w-3 inline mr-1" />
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTimeSlot}>
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Vos informations
              </CardTitle>
              <CardDescription>
                Renseignez vos coordonnées pour confirmer le rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2">Récapitulatif</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Mairie :</strong> {organization.name}</p>
                  <p><strong>Service :</strong> {service?.name}</p>
                  <p><strong>Date :</strong> {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
                  <p><strong>Heure :</strong> {selectedTimeSlot}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+241 00 00 00 00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={contactInfo.notes}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmer le rendez-vous
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Rendez-vous confirmé !</h2>
              <p className="text-muted-foreground mb-6">
                Un email de confirmation a été envoyé à {contactInfo.email}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
                <h4 className="font-medium mb-3">Détails du rendez-vous</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{organization.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{selectedTimeSlot}</span>
                  </div>
                  {organization.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{organization.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {organization.latitude && organization.longitude && (
                  <Button variant="outline" onClick={() => handleNavigate('google')}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Naviguer vers la mairie
                  </Button>
                )}
                <Button onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Info */}
        {step < 4 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Informations pratiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {organization.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{organization.address}</span>
                  </div>
                )}
                {organization.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${organization.contact_phone}`} className="hover:text-primary">
                      {organization.contact_phone}
                    </a>
                  </div>
                )}
                {organization.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${organization.contact_email}`} className="hover:text-primary">
                      {organization.contact_email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Lun-Ven: 08h00 - 16h00 (pause 12h-13h)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AppointmentBookingPage;
