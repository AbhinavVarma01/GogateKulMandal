import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

// Marathi executive committee data
const committee = [
  { name: 'नारायण शंकर', designation: 'अध्यक्ष', phone: '8080601694, 9422435994' },
  { name: 'डॉ.मोहन कृष्ण', designation: 'कार्याध्यक्ष', phone: '9011710101' },
  { name: 'केदार शशिकांत', designation: 'कार्यवाह', phone: '9421190080' },
  { name: 'मनोज गंगाधर', designation: 'सहकार्यवाह', phone: '9850766158' },
  { name: 'ओंकार आनंद', designation: 'कोषाध्यक्ष', phone: '9881058700' },
  { name: 'विनायक एकनाथ', designation: 'सदस्य', phone: '9423157088' },
  { name: 'स्मिता चारुहास', designation: 'सदस्य', phone: '9730989992' },
  { name: 'आशिष दिलिप', designation: 'सदस्य', phone: '8421147241' },
  { name: 'ओंकार रामकृष्ण', designation: 'सदस्य', phone: '9969547499' },
  { name: 'एच गुरुमूर्ती', designation: 'सदस्य', phone: '9242280639' },
  { name: 'विनायक शंकर', designation: 'सदस्य', phone: '9881090295' },
  { name: 'सुधीर गजानन', designation: 'निमंत्रित', phone: '9850027534' },
  { name: 'आदित्य दिलिप', designation: 'निमंत्रित', phone: '909693094' },
];

const KulvruttantSamitiPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-2 w-full">
        <div className="w-full flex justify-end max-w-2xl mb-6">
          <Link
            to="/dashboard"
            className="inline-block px-7 py-2 bg-amber-500 text-white font-semibold rounded-full shadow hover:bg-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 animate-bounce-in"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-amber-800">कार्यकारी समिती २०२४ ते २०२७</h2>
        <div className="overflow-x-auto w-full max-w-2xl">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-amber-200 text-amber-900">
                <th className="py-2 px-4 text-left">नाव</th>
                <th className="py-2 px-4 text-left">पद</th>
                <th className="py-2 px-4 text-left">फोन नंबर</th>
              </tr>
            </thead>
            <tbody>
              {committee.map((member, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-2 px-4">{member.name}</td>
                  <td className="py-2 px-4">{member.designation}</td>
                  <td className="py-2 px-4">{member.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default KulvruttantSamitiPage;
