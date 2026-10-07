/**
 * Static Pages
 * 404, About, Contact, Terms, Privacy, etc.
 */

import { Mail, Phone, MapPin, Clock, AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={40} className="text-gray-400" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="text-xl font-semibold text-gray-900 mt-2">Page Not Found</p>
          <p className="text-sm text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ivo Electronics</h1>
          <p className="text-lg text-gray-600">
            Your trusted destination for premium electronics in Ghana.
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Story</h2>
          <p className="text-gray-600 mt-4">
            Founded in 2024, ivo Electronics started with a simple mission: to provide Ghanaians with access to 
            high-quality electronics at fair prices. What began as a small operation has grown into one of the 
            country's most trusted online electronics retailers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Mission</h2>
          <p className="text-gray-600 mt-4">
            We believe everyone deserves access to quality technology. Our mission is to make premium electronics 
            accessible to all Ghanaians through competitive pricing, excellent customer service, and fast, reliable 
            delivery across the country.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Why Choose Us?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
            <li>Authentic products from trusted brands</li>
            <li>Competitive prices with regular promotions</li>
            <li>Fast delivery across Ghana</li>
            <li>Secure payment options including mobile money</li>
            <li>Excellent customer support</li>
            <li>Easy returns and warranty support</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-sm text-gray-600">
                We only stock authentic products from verified suppliers and brands.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Trust</h3>
              <p className="text-sm text-gray-600">
                Transparent pricing, honest descriptions, and reliable service.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Service</h3>
              <p className="text-sm text-gray-600">
                Customer-first approach with responsive support and fast resolution.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-sm text-gray-600">
                Continuously improving our platform and services for better experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600">
          We're here to help. Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">support@ivo.example.com</p>
                  <p className="text-sm text-gray-600">sales@ivo.example.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">+233 20 123 4567</p>
                  <p className="text-sm text-gray-600">+233 30 234 5678</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">
                    123 Independence Avenue<br />
                    Accra, Ghana
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Business Hours</p>
                  <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-sm text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-sm text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
            <p className="text-sm text-gray-600">
              We typically respond to emails within 24 hours during business days. 
              For urgent matters, please call us directly.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h2>
          
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition">
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Product Question</option>
                <option>Return/Refund</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={5}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition resize-none"
              />
            </div>

            <button type="submit" className="w-full btn-primary py-3 rounded-xl text-sm font-semibold">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-sm text-gray-500">Last updated: January 15, 2024</p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mt-4">
            By accessing and using ivo Electronics ("Service"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Use License</h2>
          <p className="text-gray-600 mt-4">
            Permission is granted to temporarily access the materials on ivo Electronics for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Disclaimer</h2>
          <p className="text-gray-600 mt-4">
            The materials on ivo Electronics are provided on an 'as is' basis. ivo Electronics makes no warranties, 
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
            of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Limitations</h2>
          <p className="text-gray-600 mt-4">
            In no event shall ivo Electronics or its suppliers be liable for any damages (including, without limitation, 
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
            to use the materials on ivo Electronics.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Governing Law</h2>
          <p className="text-gray-600 mt-4">
            These terms and conditions are governed by and construed in accordance with the laws of Ghana and you 
            irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-sm text-gray-500">Last updated: January 15, 2024</p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Information We Collect</h2>
          <p className="text-gray-600 mt-4">
            We collect information you provide directly to us, such as when you create an account, make a purchase, 
            contact us, or communicate with us. This information may include:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>Name and contact information</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information</li>
            <li>Order history</li>
            <li>Communications with us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. How We Use Your Information</h2>
          <p className="text-gray-600 mt-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Send you order confirmations and updates</li>
            <li>Provide customer support</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our services and develop new features</li>
            <li>Protect against fraudulent transactions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Data Security</h2>
          <p className="text-gray-600 mt-4">
            We implement appropriate security measures to protect your personal information against unauthorized access, 
            alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Your Rights</h2>
          <p className="text-gray-600 mt-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Request data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Contact Us</h2>
          <p className="text-gray-600 mt-4">
            If you have questions about this Privacy Policy, please contact us at privacy@ivo.example.com.
          </p>
        </section>
      </div>
    </div>
  );
}
