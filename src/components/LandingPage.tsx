import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { HubLocation, PortalView } from '../types';

interface LandingPageProps {
  hubs: HubLocation[];
  onNavigatePortal: (view: PortalView) => void;
  onTrackFromLanding: (code: string) => void;
  onSubmitContact: (payload: {
    name: string;
    email: string;
    topic: string;
    trackingRef?: string;
    message: string;
  }) => Promise<void>;
}

const SAMPLE_IDS = ['ZX91847261', 'EDX4920184', 'GLB7731905'];

export function LandingPage({
  hubs,
  onNavigatePortal,
  onTrackFromLanding,
  onSubmitContact,
}: LandingPageProps) {
  const [heroTrackCode, setHeroTrackCode] = useState('');

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Express Air Freight Quote');
  const [trackingRef, setTrackingRef] = useState('');
  const [message, setMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);

  const handleHeroTrack = (e: FormEvent) => {
    e.preventDefault();
    if (!heroTrackCode.trim()) {
      onNavigatePortal('tracker');
      return;
    }
    onTrackFromLanding(heroTrackCode.trim());
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setContactError('Please complete your name, email address, and message.');
      return;
    }

    setIsSendingContact(true);
    try {
      await onSubmitContact({
        name: name.trim(),
        email: email.trim(),
        topic,
        trackingRef: trackingRef.trim() || undefined,
        message: message.trim(),
      });
      setContactSuccess(true);
      setName('');
      setEmail('');
      setTrackingRef('');
      setMessage('');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8] text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display font-extrabold text-lg tracking-tight text-[#0D1B2A] whitespace-nowrap shrink-0"
          >
            EDEX Express
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#services"
              className="hover:text-[#0D1B2A] transition-colors whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#about"
              className="hover:text-[#0D1B2A] transition-colors whitespace-nowrap shrink-0"
            >
              About Us
            </a>
            <button
              type="button"
              onClick={() => onNavigatePortal('tracker')}
              className="hover:text-[#0D1B2A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Track Parcel
            </button>
            <a
              href="#contact"
              className="hover:text-[#0D1B2A] transition-colors whitespace-nowrap shrink-0"
            >
              Contact Us
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigatePortal('tracker')}
              className="md:hidden px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Track
            </button>
            <button
              type="button"
              onClick={() => onNavigatePortal('admin')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0D1B2A] hover:bg-[#17304A] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split Section */}
        <section className="bg-[#0D1B2A] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-[#FF5A1F]">
                International Air Cargo &amp; Last-Mile Courier Network
              </p>
              <h1
                className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight leading-[1.1] mt-3"
                style={{ textWrap: 'balance' }}
              >
                Global Express Freight, Tracked to the Meter.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
                Door-to-door air cargo, automated customs clearance, and real-time GPS courier
                telemetry across six international gateways. Follow every consignment from airway
                bill creation to final signature.
              </p>

              {/* Direct Tracking Bar */}
              <form onSubmit={handleHeroTrack} className="mt-7 max-w-lg">
                <div className="bg-white rounded-full p-1.5 pl-4 flex items-center gap-2 shadow-xl">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={heroTrackCode}
                    onChange={(e) => setHeroTrackCode(e.target.value)}
                    placeholder="Enter tracking number (e.g. EDX4920184)"
                    aria-label="Enter tracking number"
                    className="w-full min-w-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300">
                <span className="text-slate-400">Live Tracking IDs:</span>
                {SAMPLE_IDS.map((code, idx) => (
                  <span key={code} className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onTrackFromLanding(code)}
                      className="font-mono tabular-nums text-white hover:text-[#FF5A1F] underline underline-offset-2 decoration-slate-500 cursor-pointer"
                    >
                      {code}
                    </button>
                    {idx < SAMPLE_IDS.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigatePortal('tracker')}
                  className="px-5 py-3 rounded-xl bg-white text-[#0D1B2A] hover:bg-slate-100 text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Open Mobile Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#videos"
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <PlayCircle className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Watch Operations Film</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[260px] lg:min-h-[390px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="/src/assets/images/landing_hero_aircargo_1795180393336.jpg"
                  alt="EDEX Express air cargo freighter and courier van loading on tarmac at dusk"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#FF5A1F]">
                      24/7 Transcontinental Corridors
                    </p>
                    <p className="font-display font-bold text-base sm:text-lg text-white mt-0.5">
                      Direct Air Freight &amp; Same-Day Metro Dispatch
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-slate-200">
                    JFK · LHR · SFO · BER · NRT · LOS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Walkthroughs Section */}
        <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Inside the EDEX Courier Network
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Watch how our automated optical sortation hubs and GPS-equipped electric vans move
              high-value freight from international tarmacs to your doorstep.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_2px_14px_rgba(13,27,42,0.04)]">
              <div className="aspect-video bg-slate-900">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster="/src/assets/images/landing_hero_aircargo_1795180393336.jpg"
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/videos/edex_air_network.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold text-[#2563EB]">
                  01. Air Freight &amp; Automated Sortation
                </p>
                <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                  Tarmac-to-Hub Customs &amp; Optical Scanning
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Every parcel undergoes multi-angle optical verification and pre-arrival customs
                  brokerage before clearing regional gateways in London, Berlin, and Toronto.
                </p>
              </div>
            </article>

            <article className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_2px_14px_rgba(13,27,42,0.04)]">
              <div className="aspect-video bg-slate-900">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster="/src/assets/images/landing_courier_delivery_1795180394935.jpg"
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/videos/edex_last_mile_gps.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold text-[#FF5A1F]">
                  02. Live GPS Last-Mile Delivery
                </p>
                <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                  Real-Time Van Telemetry &amp; Last-Known Resilience
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Once a consignment enters Out for Delivery, recipients view live Google Map van
                  coordinates—or immediate last-known hub fallback if GPS drops in underground zones.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Services & Photography Gallery */}
        <section id="services" className="bg-white border-y border-slate-200/80 py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  Specialized Courier Capabilities
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  Built for footwear drops, precision optical hardware, enterprise laptops, and
                  temperature-monitored medical supplies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigatePortal('tracker')}
                className="px-4 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E84E15] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Dispatch or Track a Parcel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-[#F8FAFC]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/src/assets/images/landing_sorting_facility_1795180393754.jpg"
                    alt="Automated multi-tier parcel sorting conveyors and optical scanners"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    01. High-Speed Optical Sortation
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Multi-tier sorting conveyors route 42,000 parcels per hour with automated weight
                    and volumetric verification.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-[#F8FAFC]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/src/assets/images/landing_courier_delivery_1795180394935.jpg"
                    alt="Uniformed EDEX courier driver scanning parcel next to electric delivery van"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    02. Electric Fleet &amp; Handheld GPS
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Zero-emission metro courier vans stream real-time coordinates during final-mile
                    delivery windows.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-[#F8FAFC]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/src/assets/images/landing_coldchain_customs_1795180394022.jpg"
                    alt="Airport cold-chain customs inspection bay with insulated cargo containers"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    03. Cold-Chain &amp; Customs Desk
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Dedicated customs brokerage and insulated containers preserve clinical and
                    high-value electronics integrity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-semibold text-[#2563EB]">About EDEX Express</p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Privacy-First Logistics Engineered for Real-Time Visibility
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Founded to eliminate blind spots in cross-border shipping, EDEX Express pairs
                dedicated transatlantic and transpacific air cargo routes with instant WebSocket
                telemetry.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Every shipment is protected by our Client Data Privacy protocol: public consignment
                cards mask sensitive identifiers and route histories until the authorized tracking
                number is verified.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
                  <Globe className="w-5 h-5 text-[#2563EB]" />
                  <p className="font-display font-extrabold text-2xl text-slate-900 tabular-nums mt-2">
                    6 Hubs
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    JFK, LHR, SFO, BER, NRT, LOS
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
                  <Truck className="w-5 h-5 text-[#FF5A1F]" />
                  <p className="font-display font-extrabold text-2xl text-slate-900 tabular-nums mt-2">
                    99.4%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    On-time customs clearance
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <p className="font-display font-extrabold text-2xl text-slate-900 tabular-nums mt-2">
                    Live GPS
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    With last-known fallback
                  </p>
                </div>
              </div>
            </div>

            {/* Global Gateways Directory Preview */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(13,27,42,0.04)]">
              <h3 className="font-display font-bold text-base text-slate-900">
                International Gateway Network
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct air cargo and courier dispatch centers operating worldwide
              </p>
              <div className="mt-4 divide-y divide-slate-100">
                {hubs.map((hub) => (
                  <div key={hub.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        <span className="font-mono text-[#2563EB] mr-1.5">{hub.code}</span>
                        {hub.city}, {hub.country}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{hub.address}</p>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                      {hub.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="bg-white border-t border-slate-200/80 py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold text-[#FF5A1F]">Contact Us</p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Speak with Global Dispatch &amp; Enterprise Freight
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Need help with customs documentation, an Out for Delivery consignment, or recurring
                cold-chain shipments? Send a message directly to our operations desk.
              </p>

              <div className="pt-2 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="font-mono tabular-nums">+1 (718) 555-0194 · +44 20 7946 0821</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  <span>dispatch@edex-express.example</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>World Cargo Centre, Unit 14, London Heathrow TW6 3UA</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-slate-200/80">
              {contactSuccess && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Inquiry Sent to Dispatch</p>
                    <p className="mt-0.5">
                      Our operations team received your message and logged it in the Admin Portal
                      inbox.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jordan Blake"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Work Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Inquiry Topic
                    </label>
                    <select
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                    >
                      <option>Express Air Freight Quote</option>
                      <option>Live Delivery / Courier Support</option>
                      <option>Cold-Chain Enterprise Account</option>
                      <option>Customs Clearance Assistance</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-ref"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Tracking Number (Optional)
                    </label>
                    <input
                      id="contact-ref"
                      type="text"
                      value={trackingRef}
                      onChange={(e) => setTrackingRef(e.target.value.toUpperCase())}
                      placeholder="e.g. ZX91847261"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-msg"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share shipment weight, corridor, or delivery question..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>

                {contactError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {contactError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSendingContact}
                  className="px-6 py-3 rounded-xl bg-[#0D1B2A] hover:bg-[#17304A] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{isSendingContact ? 'Sending...' : 'Send Message to Dispatch'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#0D1B2A] text-slate-400 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white">EDEX Express</span>
            <span>·</span>
            <span>© 2026 EDEX Global Cargo Logistics</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About Us
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact Us
            </a>
            <button
              type="button"
              onClick={() => onNavigatePortal('tracker')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Mobile Tracker
            </button>
            <button
              type="button"
              onClick={() => onNavigatePortal('admin')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
