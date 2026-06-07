import React from 'react';

interface ServiceCardProps {
  image: string;
  title: string;
  price: string;
  description: string;
  features: string[];
}

const ServiceCard: React.FC<ServiceCardProps> = ({ image, title, price, description, features }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <div className="h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <span className="text-sm font-semibold text-gray-900">{price}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {description}
        </p>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-900 mr-2 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m20 6-11 11-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        <button className="flex items-center text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          Learn More
          <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const GymService: React.FC = () => {
  const services = [
    {
      image: "gym-setup.png",
      title: "Full Gym Setup",
      price: "From $4,999",
      description: "End-to-end commercial and home gym design, equipment delivery and installation.",
      features: [
        "Custom layout design",
        "Equipment sourcing",
        "Professional installation",
        "3-month support"
      ]
    },
    {
      image: "sauna-steam.png",
      title: "Sauna & Steam Room",
      price: "From $7,499",
      description: "Premium sauna and steam room installation with electrical and ventilation.",
      features: [
        "Cedar / hemlock options",
        "Digital control panel",
        "Ventilation system",
        "2-year warranty"
      ]
    },
    {
      image: "equipment-maintenance.png",
      title: "Equipment Maintenance",
      price: "From $199/mo",
      description: "Scheduled preventative maintenance for your commercial fitness equipment.",
      features: [
        "Quarterly inspections",
        "Lubrication & belts",
        "Cable & pulley check",
        "Same-week response"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-64 md:h-80 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/assets/ctabanner.png" 
            alt="Gym background" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build the gym you've always wanted.
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            Design, install, and maintain - at home, in your office, or for a commercial facility.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Services
          </p>
          <h2 className="text-2xl font-bold text-gray-900">
            What we build
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default GymService;
