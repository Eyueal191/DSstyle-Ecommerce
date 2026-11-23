import React, { useEffect } from "react";
import storeImage from "../assets/dsstyle-store.jpg";
import Title from "../components/Title.jsx";
import { updateSEO } from "../utility/seo.js";

function About() {
  useEffect(() => {
    updateSEO({
      title: "About DS Style | Streetwear, Sneakers & Accessories in Addis Ababa",
      description: "DS Style is a streetwear shop at Golagole 22, Addis Ababa: sneakers, complete outfits, jeans, belts, caps, grillz and accessories, with new drops every week on t.me/DSstyles.",
          });
  }, []);
  return (
    <div className="min-h-screen bg-[#f4f3f0] dark:bg-[#0c0b0a] py-10">
      {/* About Us Section Title */}
      <div className="max-w-6xl mx-auto px-6 pt-12 mb-4">
        <Title text1="About" text2="Us" addSolidLineAfter={true} />
      </div>

      {/* Hero Section */}
      <section className="flex flex-col sm:flex-row items-stretch gap-8 px-6 py-12 max-w-6xl mx-auto bg-white dark:bg-[#12110f] rounded-2xl shadow-lg dark:shadow-black/30 dark:border dark:border-slate-800">
        {/* Left: Image */}
        <div className="flex-1 overflow-hidden rounded-2xl shadow-md bg-gray-900">
          <img
            src={storeImage}
            alt="Inside the DS Style shop at Golagole 22"
            className="rounded-2xl w-full h-[320px] sm:h-full min-h-[320px] sm:min-h-[420px] object-cover object-top sm:object-center transform transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-6 space-y-6">
          {/* DS Style Title */}
          <div className="inline-flex items-center space-x-2">
            <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-gray-900 dark:text-white">
              DS
            </span>
            <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-pink-600">
              Style
            </span>
          </div>

          {/* Paragraphs with responsive text */}
          <div className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-700 dark:text-gray-200">
            DS Style started as a small rack of sneakers and grew into one of the
            go-to streetwear spots in Addis Ababa. Our shop at Golagole 22 is where
            the city comes to find the pieces everyone is asking about: fresh
            sneakers, clean jeans and full fits ready to wear.
          </div>
          <div className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-700 dark:text-gray-200">
            Every week we drop new arrivals on our Telegram channel: Jordans,
            Timberlands, Crocs and slides, Tech Fleece sets, baggy and slim
            jeans, belts, caps, chains and grillz. Over 10,000 followers shop
            our drops, and now you can browse them all here.
          </div>

          {/* Our Mission Title */}
          <div className="inline-flex items-center space-x-2">
            <span className="font-semibold text-xl sm:text-2xl lg:text-3xl text-gray-900 dark:text-white">
              Our
            </span>
            <span className="font-semibold text-xl sm:text-2xl lg:text-3xl text-pink-600">
              Mission
            </span>
          </div>

          {/* Paragraph with responsive text */}
          <div className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-700 dark:text-gray-200">
            Our mission is simple: make it easy to look good. We pick quality
            pieces, style them into complete outfits, and get them to you fast,
            whether you walk into the shop or order from your phone.
          </div>
        </div>
      </section>

      {/* Why Choose Us Section Title */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <Title text1="Why" text2="Choose Us" addSolidLineAfter={true} />
      </div>

      {/* Features Section */}
      <div className="py-12 max-w-6xl mx-auto px-6 flex flex-col sm:flex-row gap-6">
        {/* Quality Assurance Card */}
        <div className="bg-white dark:bg-[#12110f] rounded-2xl shadow-lg dark:shadow-black/30 dark:border dark:border-slate-800 p-6 flex-1 hover:shadow-xl transition-shadow duration-300">
          <div className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Hand-Picked Quality
          </div>
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Every pair and every piece is checked in the shop before it goes on
            the rack or out for delivery.
          </div>
        </div>

        {/* Seamless Convenience Card */}
        <div className="bg-white dark:bg-[#12110f] rounded-2xl shadow-lg dark:shadow-black/30 dark:border dark:border-slate-800 p-6 flex-1 hover:shadow-xl transition-shadow duration-300">
          <div className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Complete Fits
          </div>
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Not sure what goes with what? Our ready-styled outfits pair the tee,
            jeans, belt, cap and kicks for you.
          </div>
        </div>

        {/* Outstanding Customer Service Card */}
        <div className="bg-white dark:bg-[#12110f] rounded-2xl shadow-lg dark:shadow-black/30 dark:border dark:border-slate-800 p-6 flex-1 hover:shadow-xl transition-shadow duration-300">
          <div className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Order Your Way
          </div>
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Visit us at Golagole 22, order via @DSstyle2, get help from @Dsstyle1 on Telegram, or call
            0918 10 10 22. We deliver across Addis Ababa.
          </div>
        </div>
      </div>
    </div>
  );
}
export default About;
