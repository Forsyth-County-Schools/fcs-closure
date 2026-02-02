import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Globe, Shield, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Backlinks & Resources - FCS School Status Checker",
  description: "Educational resources and partner websites for Forsyth County Schools parents and students. Weather monitoring tools and school closure information.",
  keywords: "school resources, educational links, weather tools, Forsyth County Schools, backlinks",
};

const backlinkCategories = [
  {
    title: "Official School Resources",
    icon: <Globe className="w-5 h-5" />,
    links: [
      {
        name: "Forsyth County Schools Official Website",
        url: "https://www.forsyth.k12.ga.us",
        description: "Official district website with comprehensive information"
      },
      {
        name: "FCS Parent Portal",
        url: "https://www.forsyth.k12.ga.us/fs/pages/0/parent-portal",
        description: "Access grades, attendance, and student information"
      },
      {
        name: "School Calendar",
        url: "https://www.forsyth.k12.ga.us/fs/pages/0/calendar",
        description: "Academic calendar and important dates"
      }
    ]
  },
  {
    title: "Weather & Emergency Services",
    icon: <Shield className="w-5 h-5" />,
    links: [
      {
        name: "National Weather Service - Atlanta",
        url: "https://www.weather.gov/ffc/",
        description: "Official weather forecasts and alerts for Forsyth County"
      },
      {
        name: "Georgia Emergency Management",
        url: "https://gema.georgia.gov/",
        description: "State emergency preparedness and response information"
      },
      {
        name: "Forsyth County Emergency Services",
        url: "https://www.forsythco.com/Emergency-Services",
        description: "Local emergency management and safety resources"
      }
    ]
  },
  {
    title: "Educational Resources",
    icon: <Clock className="w-5 h-5" />,
    links: [
      {
        name: "Georgia Department of Education",
        url: "https://www.gadoe.org/",
        description: "State educational standards and resources"
      },
      {
        name: "Forsyth County Public Library",
        url: "https://www.forsythpl.org/",
        description: "Online learning resources and digital library"
      },
      {
        name: "Georgia Learning Resources System",
        url: "https://www.glrs.org/",
        description: "Special education resources and support"
      }
    ]
  }
];

export default function BacklinksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Educational Resources & Partners
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Helpful links and resources for Forsyth County Schools families
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            {backlinkCategories.map((category, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-blue-600 dark:text-blue-400 mr-3">
                    {category.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {category.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="border-l-4 border-blue-500 pl-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                      >
                        <div className="flex items-start">
                          <ExternalLink className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              {link.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {link.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Link Exchange Program
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you operate an educational or community resource website serving Forsyth County, 
              we'd be interested in exploring link exchange opportunities to better serve our community.
            </p>
            <div className="bg-white dark:bg-gray-700 rounded p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">To link to us:</h3>
              <code className="block bg-gray-100 dark:bg-gray-600 p-3 rounded text-sm">
                &lt;a href="https://schoolcancelled.today" title="FCS School Status Checker"&gt;
                  FCS School Status Checker - Real-time Weather Monitoring
                &lt;/a&gt;
              </code>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to School Status Checker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
