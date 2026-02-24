import Image from "next/image";

export default function BusinessBrandLocation() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-[#295A47] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Our Showroom
          </h1>
          <p className="mt-4 text-base md:text-xl text-white/90">
            Experience premium furniture at our exclusive location
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 lg:p-14">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-semibold text-gray-800 text-center mb-7">
            Location & Contact
          </h2>

          {/* Image + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative w-full h-100 lg:h-100 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/showroom-location.jpeg"
                alt="Kayapalat Showroom"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Info */}
            <div className="space-y-8">
              {/* Address */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                  📍 Address
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  <span className="font-medium text-gray-700">
                    Kayapalat Showroom
                  </span>
                  <br />
                  112 Dr. B. C. Roy Road, Mouza - Elachi, Dakshin Jagaddal, Rajpur Sonarpur
                  <br />
                  Elachi P, West Bengal- 700152
                  <br />
                  India
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                  ☎️ Contact
                </h3>
                <ul className="space-y-2 text-gray-600 text-base md:text-lg">
                  <li>
                    <span className="font-medium text-gray-700">Phone:</span>{" "}
                    +91 98304 77791
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Email:</span>{" "}
                    info@kayapalat.co
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Hours:</span>{" "}
                    Mon – Sat, 10:00 AM – 7:00 PM
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mt-16 border-t pt-12">
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center mb-8">
              Find Us on Google Maps
            </h3>

            <div className="w-full h-72 sm:h-96 rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1250.370373312814!2d88.41372301035743!3d22.402372363032896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1768197500878!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kayapalat Location"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
