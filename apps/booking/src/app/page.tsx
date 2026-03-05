import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  Shield,
  Wifi,
  Search,
  ArrowRight,
  Star,
  Volume2,
  Zap,
  Smartphone,
  ChevronDown,
  Check,
  Building2,
  Plane,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';
import { getTenantSlug, getTenantBranding, DEFAULT_BRANDING } from '@/lib/tenant';
import { boothsApi, locationsApi } from '@/lib/api';
import { BoothCard } from '@/components/BoothCard';
import { SearchForm } from '@/components/SearchForm';

export default async function HomePage() {
  const slug = await getTenantSlug();
  const branding = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;
  const tenant = branding || DEFAULT_BRANDING;

  let featuredBooths: any[] = [];
  let locations: any[] = [];

  if (slug) {
    const [boothsRes, locationsRes] = await Promise.all([
      boothsApi.list(slug),
      locationsApi.list(slug),
    ]);
    featuredBooths = boothsRes.data?.slice(0, 6) || [];
    locations = locationsRes.data || [];
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-[#09090B] to-[#09090B]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-[200px] h-[200px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative container-page pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-zinc-400">Available 24/7 in multiple cities</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Your private space,{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                anywhere
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Book soundproof work booths in seconds. Perfect for calls, deep work, or meetings — in malls, airports, and business centers worldwide.
            </p>

            {/* Search Form */}
            <div className="max-w-3xl mx-auto">
              <SearchForm tenantSlug={slug || 'demo'} locations={locations} />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 mt-12">
              <QuickStat value="500+" label="Booths" />
              <div className="w-px h-8 bg-zinc-800" />
              <QuickStat value="50+" label="Locations" />
              <div className="w-px h-8 bg-zinc-800" />
              <QuickStat value="4.9" label="Rating" icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar — Client Logos */}
      <section className="relative border-y border-zinc-800/50">
        <div className="absolute inset-0 bg-zinc-900/30" />
        <div className="relative container-page py-10">
          <p className="text-center text-sm text-zinc-600 uppercase tracking-widest mb-8 font-medium">
            Trusted by teams at
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-50 hover:opacity-70 transition-opacity duration-500">
            {[
              { name: 'Siemens', src: '/images/clients/siemens.png' },
              { name: 'DHL', src: '/images/clients/dhl.png' },
              { name: 'PwC', src: '/images/clients/pwc.png' },
              { name: 'BASF', src: '/images/clients/basf.png' },
              { name: 'Mars', src: '/images/clients/mars.png' },
              { name: 'IQOS', src: '/images/clients/iqos.png' },
              { name: 'N-iX', src: '/images/clients/nix.png' },
              { name: 'Ciklum', src: '/images/clients/ciklum.png' },
            ].map((client) => (
              <Image
                key={client.name}
                src={client.src}
                alt={client.name}
                width={100}
                height={36}
                className="h-7 md:h-9 w-auto brightness-0 invert"
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Book in three steps
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              From search to entering your booth — it takes less than a minute.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <StepCard
              step="01"
              icon={<Search className="w-6 h-6" />}
              title="Find a booth"
              description="Browse available spaces by location, date, and time. Filter by booth type and amenities."
            />
            <StepCard
              step="02"
              icon={<Clock className="w-6 h-6" />}
              title="Book instantly"
              description="Select your time slot, confirm the booking, and pay securely. No phone calls needed."
            />
            <StepCard
              step="03"
              icon={<Smartphone className="w-6 h-6" />}
              title="Enter with a code"
              description="Get your PIN code instantly. Walk up to the booth, enter the code, and start working."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-transparent" />
        <div className="relative container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Built for focus
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Every detail designed to help you do your best work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard
              icon={<Volume2 className="w-6 h-6" />}
              title="Soundproof"
              description="Professional acoustic insulation so you can talk freely or work in complete silence."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Smart Lock"
              description="PIN code, Bluetooth, or remote unlock. No keys, no reception — just walk in."
            />
            <FeatureCard
              icon={<Wifi className="w-6 h-6" />}
              title="High-Speed WiFi"
              description="Dedicated connection in every booth. Video calls, large uploads — no lag."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Power & USB"
              description="Multiple outlets and USB-C ports. Charge all your devices simultaneously."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Flexible Hours"
              description="Book from 1 hour to a full day. Available early morning to late evening."
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              title="Prime Locations"
              description="In malls, airports, business centers, and coworking spaces across multiple cities."
            />
          </div>
        </div>
      </section>

      {/* Booth Showcase */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">Our booths</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Choose your space
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              From solo focus pods to team meeting rooms — we have the right size for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <BoothShowcaseCard
              image="/images/booths/solo.webp"
              name="Solo"
              capacity="1 person"
              description="Perfect for calls and focused work"
              price="from €5/hr"
            />
            <BoothShowcaseCard
              image="/images/booths/duet.png"
              name="Duet"
              capacity="2 people"
              description="Ideal for 1-on-1 meetings"
              price="from €8/hr"
            />
            <BoothShowcaseCard
              image="/images/booths/quartet.png"
              name="Quartet"
              capacity="4 people"
              description="For team meetings and brainstorms"
              price="from €12/hr"
            />
          </div>

          {/* Featured Spaces from API */}
          {featuredBooths.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">Available now</h3>
                <Link
                  href="/spaces"
                  className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  View all
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBooths.map((booth) => (
                  <BoothCard key={booth.id} booth={booth} tenantSlug={slug!} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-transparent" />
        <div className="relative container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Pay as you go or save with a subscription. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Pay As You Go"
              price="€5"
              period="/hour"
              description="Perfect for occasional use"
              features={[
                'Book any available booth',
                'Instant access code',
                'Cancel up to 2h before',
                'All amenities included',
              ]}
            />
            <PricingCard
              name="Regular"
              price="€79"
              period="/month"
              description="For weekly users"
              features={[
                '20 hours per month',
                'Priority booking',
                '10% off extra hours',
                'All booth types',
                'Dedicated support',
              ]}
              featured
            />
            <PricingCard
              name="Business"
              price="€199"
              period="/month"
              description="For teams and companies"
              features={[
                '60 hours per month',
                'Multi-user accounts',
                '20% off extra hours',
                'Meeting room access',
                'Invoice billing',
                'Account manager',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              What people say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <TestimonialCard
              quote="Game changer for my remote work days. I pop into a booth between meetings at the mall — total focus."
              name="Sarah K."
              role="Product Manager"
              rating={5}
            />
            <TestimonialCard
              quote="We use MeetPoint booths for confidential calls. The soundproofing is excellent and booking takes seconds."
              name="Michael T."
              role="Legal Consultant"
              rating={5}
            />
            <TestimonialCard
              quote="Found a booth at the airport during a 3-hour layover. Best productive layover I've ever had."
              name="Anna R."
              role="Startup Founder"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-transparent" />
        <div className="relative container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">Locations</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Find us everywhere
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Our booths are placed where you need them most.
            </p>
          </div>

          {/* Map with location pins */}
          <div className="relative w-full aspect-[2/1] bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-12">
            {/* Map Background - Europe SVG */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="w-full h-full" fill="none">
                {/* Simplified Europe outline */}
                <path d="M350 50 L380 60 L400 55 L420 65 L450 58 L470 70 L490 68 L510 80 L500 95 L520 100 L530 120 L520 140 L540 150 L530 170 L550 180 L540 200 L520 210 L530 230 L510 240 L490 235 L470 250 L450 245 L430 260 L410 255 L390 270 L370 265 L350 280 L330 275 L310 285 L290 270 L270 260 L260 240 L250 220 L240 200 L250 180 L240 160 L250 140 L260 120 L270 100 L280 80 L300 70 L320 60 Z" fill="currentColor" className="text-violet-500/30" />
              </svg>
            </div>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Location Pins */}
            {locations.length > 0 ? (
              locations.slice(0, 6).map((location, i) => {
                // Map real coordinates to relative positions on our map
                // Using approximate European bounds: lat 35-60, lng -10 to 40
                const x = location.longitude ? ((location.longitude + 10) / 50) * 100 : 30 + i * 15;
                const y = location.latitude ? ((60 - location.latitude) / 25) * 100 : 30 + i * 10;
                return (
                  <Link
                    key={location.id}
                    href={`/spaces?location=${location.id}`}
                    className="absolute group"
                    style={{ left: `${Math.max(5, Math.min(90, x))}%`, top: `${Math.max(5, Math.min(90, y))}%` }}
                  >
                    {/* Pulse ring */}
                    <span className="absolute -inset-3 rounded-full bg-violet-500/20 animate-ping" />
                    {/* Pin dot */}
                    <span className="relative block w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-lg shadow-violet-500/50 border-2 border-zinc-900" />
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                      {location.name}
                      <span className="block text-xs text-zinc-500">{location.city}</span>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800" />
                    </span>
                  </Link>
                );
              })
            ) : (
              /* Default pins if no API data */
              <>
                <MapPinStatic left="42%" top="35%" label="Warsaw" />
                <MapPinStatic left="40%" top="30%" label="Krakow" />
                <MapPinStatic left="48%" top="32%" label="Kyiv" />
                <MapPinStatic left="30%" top="60%" label="Valencia" />
              </>
            )}

            {/* Gradient edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-transparent to-[#09090B]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/50 via-transparent to-[#09090B]/50" />
          </div>

          {/* Location Type Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <LocationTypeCard
              icon={<ShoppingBag className="w-6 h-6" />}
              title="Shopping Malls"
              description="Take a break from shopping for a quick call or meeting"
            />
            <LocationTypeCard
              icon={<Building2 className="w-6 h-6" />}
              title="Business Centers"
              description="Extra meeting rooms when your office is full"
            />
            <LocationTypeCard
              icon={<Briefcase className="w-6 h-6" />}
              title="Coworking Spaces"
              description="Private booths in your favorite coworking hub"
            />
            <LocationTypeCard
              icon={<Plane className="w-6 h-6" />}
              title="Airports"
              description="Productive layovers and pre-flight focus time"
            />
          </div>

          {/* Actual Locations from API */}
          {locations.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.slice(0, 6).map((location) => (
                <Link
                  key={location.id}
                  href={`/spaces?location=${location.id}`}
                  className="group flex items-start gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {location.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {location.address}, {location.city}
                    </p>
                    {location.boothCount && (
                      <p className="text-sm text-violet-400 font-medium mt-1">
                        {location.boothCount} booths available
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Common questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FaqItem
              question="How do I access the booth?"
              answer="After booking, you'll receive a PIN code instantly. Enter it on the keypad next to the booth door. You can also unlock via Bluetooth from our app."
            />
            <FaqItem
              question="Can I cancel or reschedule?"
              answer="Yes, you can cancel or reschedule up to 2 hours before your booking starts, free of charge. Changes can be made from your dashboard."
            />
            <FaqItem
              question="What's included in every booth?"
              answer="Every booth comes with high-speed WiFi, power outlets, USB-C charging, ventilation, LED lighting, and a desk surface. Larger booths include a monitor and whiteboard."
            />
            <FaqItem
              question="Do I need to create an account?"
              answer="Guest bookings are available — just enter your email to receive your access code. Creating an account lets you manage bookings and access subscription plans."
            />
            <FaqItem
              question="What happens if I exceed my booked time?"
              answer="If the booth is available after your session, you can extend directly from the app. Otherwise, you'll receive a notification 10 minutes before your session ends."
            />
            <FaqItem
              question="Are the booths wheelchair accessible?"
              answer="Yes, our ground-floor booths are fully wheelchair accessible. Filter by 'Accessible' when searching to find these spaces."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-[#0F0F11] to-blue-950/40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-violet-500/10 to-transparent rounded-full blur-3xl" />

            <div className="relative p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to focus?
              </h2>
              <p className="text-xl text-zinc-400 mb-8 max-w-xl mx-auto">
                Book your first booth in under 60 seconds. No commitment, no subscription required.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/spaces"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/25"
                >
                  <Search className="w-5 h-5" />
                  Browse Spaces
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ——— Sub-components ——— */

function QuickStat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 md:p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-400">
          {icon}
        </div>
        <span className="text-sm font-mono text-zinc-600">{step}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:from-violet-500/30 group-hover:to-blue-500/30 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function BoothShowcaseCard({ image, name, capacity, description, price }: { image: string; name: string; capacity: string; description: string; price: string }) {
  return (
    <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
      </div>
      <div className="p-6 -mt-8 relative">
        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-zinc-500 mb-1">{capacity}</p>
        <p className="text-zinc-400 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            {price}
          </span>
          <Link
            href="/spaces"
            className="text-sm text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1"
          >
            Book now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, featured }: { name: string; price: string; period: string; description: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`relative p-6 md:p-8 rounded-2xl border transition-all ${featured ? 'bg-gradient-to-b from-violet-950/50 to-zinc-900/50 border-violet-500/30 shadow-lg shadow-violet-500/10' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-zinc-500">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-zinc-400">
            <Check className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${featured ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
      >
        Get Started
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, name, role, rating }: { quote: string; name: string; role: string; rating: number }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-zinc-300 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-semibold text-white">{name}</p>
        <p className="text-sm text-zinc-500">{role}</p>
      </div>
    </div>
  );
}

function LocationTypeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all text-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-400 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function MapPinStatic({ left, top, label }: { left: string; top: string; label: string }) {
  return (
    <div className="absolute group" style={{ left, top }}>
      <span className="absolute -inset-3 rounded-full bg-violet-500/20 animate-ping" />
      <span className="relative block w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-lg shadow-violet-500/50 border-2 border-zinc-900" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        {label}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800" />
      </span>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all list-none [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-zinc-200 pr-4">{question}</span>
        <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 pt-3 -mt-2 bg-zinc-900/50 border border-t-0 border-zinc-800 rounded-b-2xl">
        <p className="text-zinc-400 leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
