"use client";

export default function VenueCard({ venueData }) {
  return (
    <>
      {venueData && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-2">
            Real-time Venue Data
          </h3>
          <div className="space-y-2 text-sm mb-4">
            <div>
              <span className="font-medium">Venue:</span> {venueData.name}
            </div>
            <div>
              <span className="font-medium">Location:</span>{" "}
              {venueData.locationName}
            </div>
            <div>
              <span className="font-medium">Address:</span>{" "}
              {venueData.address}
            </div>
            <div>
              <span className="font-medium">Coordinates:</span>{" "}
              {venueData.latitude}, {venueData.longitude}
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="w-full h-64 rounded overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${venueData.latitude},${venueData.longitude}&hl=es&z=14&output=embed`}
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
