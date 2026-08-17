'use client';

import React, { useEffect, useState } from 'react';

export default function ManufacturerRulesPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
        <div
          className="h-full bg-black transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">📜 Manufacturer Rules & Regulations</h1>                
        </div>
      </div>
      <div>
<p className="text-lg text-center text-red-500">
  For Discussion Contact 
  <span className="block font-bold">Mr. John Bor - 7044400100</span>
</p>      </div>
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="1. Registration & Eligibility">
            <List items={[
              'Provide valid business credentials (GST, PAN, license).',
              'All information must be accurate and updated.',
              'Kayapalat can approve/reject any manufacturer.'
            ]} />
          </Section>

          <Section title="2. Product Listing Guidelines">
            <List items={[
              'Include name, description, price, and images.',
              'Products must be original and legal.',
              'No prohibited or harmful items allowed.'
            ]} />
          </Section>

          <Section title="3. Pricing & Commission">
            <List items={[
              'Manufacturers set their own pricing.',
              'Kayapalat charges commission per sale.',
              'No misleading or inconsistent pricing.'
            ]} />
          </Section>

          <Section title="4. Order Fulfillment & Delivery">
            <List items={[
              'Accept/reject orders within 24 hours.',
              'Dispatch within committed timeline.',
              'Provide tracking details.'
            ]} />
          </Section>

          <Section title="5. Returns, Refunds & Replacement">
            <List items={[
              'Accept returns for damaged/wrong/defective items.',
              'Process within 5–7 days.'
            ]} />
          </Section>

          <Section title="6. Quality Assurance">
            <List items={[
              'Maintain minimum quality standards.',
              'Poor performance may lead to suspension.'
            ]} />
          </Section>

          <Section title="7. Performance & Ratings">
            <List items={[
              'Tracked via ratings, delivery, complaints.',
              'Listings may be promoted/demoted.'
            ]} />
          </Section>

          <Section title="8. Compliance & Legal Responsibility">
            <List items={[
              'Responsible for product authenticity and legality.',
              'Kayapalat acts only as a platform.'
            ]} />
          </Section>

          <Section title="9. Prohibited Practices">
            <List items={[
              'No fake info, review manipulation, or counterfeits.'
            ]} />
          </Section>

          <Section title="10. Data Privacy">
            <List items={[
              'Use customer data only for order fulfillment.'
            ]} />
          </Section>

          <Section title="11. Suspension & Termination">
            <List items={[
              'Kayapalat can suspend or terminate accounts.'
            ]} />
          </Section>

          <Section title="12. Payments & Settlements">
            <List items={[
              'Payments after delivery & return window.',
              'Commission/penalties deducted.'
            ]} />
          </Section>

          <Section title="13. Policy Updates">
            <List items={[
              'Policies may change anytime.'
            ]} />
          </Section>

          <Section title="14. Support & Disputes">
            <List items={[
              'All disputes handled by Kayapalat support.'
            ]} />
          </Section>
        </div>

        {/* Acceptance */}
        <div className="mt-8">
          <div className="rounded-2xl shadow-md border bg-white p-5 sm:p-6">
            <p className="text-base sm:text-lg font-semibold mb-2">✅ Acceptance Clause</p>
            <p className="text-sm sm:text-base text-gray-600">
              By continuing, you agree to all rules and regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border hover:shadow-md transition p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm sm:text-base text-gray-700">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
