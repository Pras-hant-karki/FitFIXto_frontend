'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="w-full h-16 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6">
        {/* Logo */}
        <div className="w-36 h-9 bg-gray-200 dark:bg-zinc-700 rounded">
          {/* Logo placeholder */}
        </div>

        {/* Navigation */}
        <nav className="flex gap-12 items-center">
          <a href="#shop" className="font-bold text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Shop</a>
          <a href="#services" className="font-bold text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Services</a>
          <a href="#trainers" className="font-bold text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Trainers</a>
          <a href="#gyms" className="font-bold text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Gyms</a>
        </nav>

        {/* Action Icons */}
        <div className="flex gap-5 items-center">
          <button className="w-9 h-9 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="w-9 h-9 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
            </svg>
          </button>
          <button onClick={toggleTheme} className="w-9 h-9 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors">
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m6.364 1.636l-.707-.707M21 12h-1m1.364 6.364l-.707-.707M12 21v-1m6.364-1.636l-.707.707M3 12h1M3.636 5.636l.707.707M12 3a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.64 15.89c-.22-1.12-.64-2.18-1.2-3.12.36-1.83.24-3.74-.6-5.32-1.51-2.93-4.36-4.75-7.44-4.75-2.39 0-4.6 1.04-6.14 2.86-.64-.08-1.27-.13-1.92-.13-5.5 0-10 4.5-10 10s4.5 10 10 10c5.05 0 9.27-3.78 9.9-8.65z" />
              </svg>
            )}
          </button>
          <button className="w-9 h-9 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button className="w-9 h-9 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Trust Signals */}
      <section className="w-full py-6 px-6 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center">✓</div>
            <span className="font-bold text-sm text-black dark:text-white">Lifetime Warranty</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center">📦</div>
            <span className="font-bold text-sm text-black dark:text-white">Free Shipping</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center">✔</div>
            <span className="font-bold text-sm text-black dark:text-white">Certified Equipment</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center">🆘</div>
            <span className="font-bold text-sm text-black dark:text-white">Expert Support</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="w-full h-96 relative bg-cover bg-center" style={{backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.3) 100%), url(/hero-bg.jpg)'}}>
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 py-16 max-w-2xl">
            <h1 className="text-6xl font-black text-white mb-6 leading-tight">Built for Strength</h1>
            <p className="text-lg text-white/80 mb-8 max-w-md">Commercial-grade equipment, certified supplements, pro trainers & expert installation.</p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-red-900 text-white font-bold rounded hover:bg-red-800">
                Shop Equipment →
              </button>
              <button className="px-6 py-3 bg-white/20 backdrop-blur text-white font-bold rounded hover:bg-white/30">
                Hire a Trainer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Equipment Section */}
      <section className="w-full py-16 px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2">New arrivals</p>
            <h2 className="text-3xl font-black text-black dark:text-white mb-4">Featured Equipment</h2>
            <p className="text-base text-gray-500 dark:text-zinc-400 max-w-lg">Hand-picked, verified and ready to ship from our Knowledge base</p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {/* Product Card 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="h-64 bg-gray-200 dark:bg-zinc-800 relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-2 py-1 rounded">✓ VERIFIED</span>
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded">-25%</span>
                </div>
                <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 dark:bg-zinc-700/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-600">♡</button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Dumbbells · IronCore</p>
                <h3 className="font-bold text-black dark:text-white mb-3">Pro Hex Dumbbell Set 5-50lbs</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-bold text-sm text-black dark:text-white">4.8</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">(312)</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-black text-black dark:text-white">$599</span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400 line-through">$799</span>
                </div>
                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded hover:bg-gray-900 dark:hover:bg-gray-100">🛒 Add to Cart</button>
              </div>
            </div>

            {/* Product Card 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="h-64 bg-gray-200 dark:bg-zinc-800 relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-2 py-1 rounded">✓ VERIFIED</span>
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded">-19%</span>
                </div>
                <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 dark:bg-zinc-700/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-600">♡</button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Racks · TitanForge</p>
                <h3 className="font-bold text-black dark:text-white mb-3">Olympic Power Rack PRO-X</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-bold text-sm text-black dark:text-white">4.9</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">(187)</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-black text-black dark:text-white">$1299</span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400 line-through">$1599</span>
                </div>
                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded hover:bg-gray-900 dark:hover:bg-gray-100">🛒 Add to Cart</button>
              </div>
            </div>

            {/* Product Card 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="h-64 bg-gray-200 dark:bg-zinc-800 relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-2 py-1 rounded">✓ VERIFIED</span>
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded">-20%</span>
                </div>
                <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 dark:bg-zinc-700/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-600">♡</button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Supplements · PureFuel</p>
                <h3 className="font-bold text-black dark:text-white mb-3">Premium Whey Isolate 5lb</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-bold text-sm text-black dark:text-white">4.7</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">(1204)</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-black text-black dark:text-white">$79</span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400 line-through">$99</span>
                </div>
                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded hover:bg-gray-900 dark:hover:bg-gray-100">🛒 Add to Cart</button>
              </div>
            </div>

            {/* Product Card 4 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="h-64 bg-gray-200 dark:bg-zinc-800 relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-2 py-1 rounded">✓ VERIFIED</span>
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-2 py-1 rounded">REFURB</span>
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded">-17%</span>
                </div>
                <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 dark:bg-zinc-700/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-600">♡</button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Cardio · RunForge</p>
                <h3 className="font-bold text-black dark:text-white mb-3">Commercial Treadmill T-9000</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-bold text-sm text-black dark:text-white">4.6</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">(89)</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-black text-black dark:text-white">$2499</span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400 line-through">$2999</span>
                </div>
                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded hover:bg-gray-900 dark:hover:bg-gray-100">🛒 Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="w-full py-16 px-6 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2">Shop the floor</p>
            <h2 className="text-3xl font-black text-black dark:text-white mb-4">Shop by Category</h2>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-3 gap-6">
            {['Dumbbells (42 products)', 'Racks (18 products)', 'Cardio (27 products)', 'Supplements (84 products)', 'Benches (23 products)', 'Barbells (19 products)'].map((category, idx) => (
              <div key={idx} className="h-72 bg-cover bg-center rounded-xl relative overflow-hidden hover:shadow-lg transition cursor-pointer" style={{backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0) 100%), url(/category-bg.jpg)'}}>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{category.split('(')[0]}</h3>
                  <p className="text-sm text-white/80">{category.split('(')[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-16 px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2">We build it</p>
            <h2 className="text-3xl font-black text-black dark:text-white mb-4">Professional Services</h2>
            <p className="text-base text-gray-500 dark:text-zinc-400 max-w-2xl">From design to install to maintenance — turnkey for your fitness goals</p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-3 gap-6">
            {[
              {title: 'Full Gym Setup', price: 'From $4,999', features: ['Custom layout design', 'Equipment sourcing', 'Professional installation', '30-day support']},
              {title: 'Sauna & Steam Room', price: 'From $7,499', features: ['Cedar / hemlock options', 'Digital control panel', 'Ventilation system', '2-year warranty']},
              {title: 'Equipment Maintenance', price: 'From $199/mo', features: ['Quarterly inspections', 'Lubrication & belts', 'Cable & pulley check', 'Same-week response']}
            ].map((service, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="h-64 bg-gray-200 dark:bg-zinc-800"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">{service.title}</h3>
                  <p className="font-black text-lg text-gray-900 dark:text-white mb-4">{service.price}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Premium service with complete support</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-black dark:text-white">
                        <span className="text-lg">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="text-black dark:text-white font-bold hover:text-gray-600 dark:hover:text-gray-300">Learn More →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2">Real talk</p>
            <h2 className="text-3xl font-black text-black dark:text-white">What lifters say</h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-3 gap-6">
            {[
              {name: 'Bishal R.', text: 'Built out my entire home gym with FitFIXto. Equipment is solid, shipping was fast.'},
              {name: 'Priya M.', text: 'My trainer Aria changed how I think about training. 100% recommend their coaching.'},
              {name: 'Kiran T.', text: 'Sauna install was clean, fast and exactly to spec. Couldn\'t ask for better service.'}
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                <p className="text-sm text-black dark:text-white mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black dark:text-white">{testimonial.name}</span>
                  <span className="text-xs text-black dark:text-white">✓ Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers Section */}
      <section className="w-full py-16 px-6 bg-cover bg-center relative" style={{backgroundImage: 'linear-gradient(90deg, rgba(3, 2, 19, 0.95) 0%, rgba(3, 2, 19, 0.7) 100%), url(/trainers-bg.jpg)'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-white max-w-lg">
            <p className="text-xs font-black uppercase tracking-wider text-white/90 mb-2">Train with the best</p>
            <h2 className="text-3xl font-black text-white mb-4">Elite coaches. Real results.</h2>
            <p className="text-base text-white/90 mb-8">Book certified personal trainers, online or in-person. Transform your fitness journey with expert guidance.</p>
            <button className="px-6 py-3 bg-white dark:bg-zinc-900 text-black dark:text-white font-black rounded hover:bg-gray-100 dark:hover:bg-zinc-800">Find Your Trainer →</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 gap-8 mb-8 pb-8 border-b border-gray-200 dark:border-zinc-800">
            <div>
              <div className="w-36 h-9 bg-gray-200 dark:bg-zinc-700 rounded mb-4"></div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Premium gym equipment, supplements, services and trainers.</p>
              <div className="flex gap-3">
                <button className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 dark:hover:bg-zinc-700">f</button>
                <button className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 dark:hover:bg-zinc-700">𝕏</button>
                <button className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 dark:hover:bg-zinc-700">📷</button>
                <button className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 dark:hover:bg-zinc-700">▶</button>
              </div>
            </div>
            {[
              {title: 'About', links: ['Our Story', 'Careers', 'Press', 'Sustainability']},
              {title: 'Shop', links: ['All Equipment', 'Supplements', 'Compare', 'Wishlist']},
              {title: 'Services', links: ['Gym Setup', 'Sauna & Steam', 'Maintenance', 'Hire Trainers']},
              {title: 'Support', links: ['Help Center', 'Order Tracking', 'Returns', 'Contact Us']}
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-black dark:text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, i) => (
                    <li key={i}><a href="#" className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer Bottom */}
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-zinc-400">
            <span>© 2026 FitFIXto. All rights reserved.</span>
            <span>Built for athletes, by athletes.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
