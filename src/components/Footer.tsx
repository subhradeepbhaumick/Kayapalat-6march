'use client';

import Link from "next/link";
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Abril_Fatface as af , Lexend as lex , Laila as l , Lancelot as lt , Abhaya_Libre as al} from "next/font/google";

const abril = af({ variable: "--af-sans", subsets: ["latin"], weight: '400' });
const lexend = lex({ variable: "--lex-sans", subsets: ["latin"], weight: ['200','300','400','500','600','700','800','900'] });
const laila = l({ variable: "--l-sans", subsets: ["latin"], weight: ['300','400','500','600','700'] });
const lancelot = lt({ variable: "--lt-sans", subsets: ["latin"], weight: '400' });
const abhaya = al({ variable: "--al-sans", subsets: ["latin"], weight: ['400','500','600','700','800'] });

const Footer = () => {
  return (
<div className="bg-[#D2EBD0] ">
<footer className="relative z-100 bg-teal-800 text-white p-10 mt-auto ">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-10   mt-6 px-4  lg:px-20">
        {/* Newsletter Section */}
        <div>
          <h2 className="text-xl  font-[var(--af-sans)]">NewsLetter</h2>
          <div className="mt-4 flex relative">
            <input
              type="email"
              placeholder="Enter your E-mail"
              className="p-2 bg-transparent border  border-white rounded-lg text-white placeholder-gray-400 w-full"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-white transition-colors hover:text-teal-300">
              →
            </button>
          </div>
          <p className="text-xs mt-2 font-[var(--lex-sans)]">Sign up to stay updated & receive special offers</p>
          
          {/* Social Links */}
          <div className="mt-6">
            <h3 className="text-lg  font-[var(--l-sans)]">Follow Us:</h3>
            <div className="flex gap-6 mt-3 text-2xl">
              <Link href="https://facebook.com/" target="_blank"><Facebook className="hover:text-gray-400 transition" /></Link>
              <Link href="https://instagram.com/" target="_blank"><Instagram className="hover:text-gray-400 transition" /></Link>
              <Link href="https://www.youtube.com/@kayapalat1622" target="_blank"><Youtube className="hover:text-gray-400 transition" /></Link>
              <Link href="https://linkedin.com/" target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="hover:text-gray-400 transition">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764c.966 0 1.75.79 1.75 1.764s-.784 1.764-1.75 1.764zm13.5 11.268h-3v-5.604c0-1.337-.026-3.06-1.863-3.06-1.865 0-2.153 1.457-2.153 2.963v5.701h-3v-10h2.877v1.368h.041c.4-.758 1.378-1.559 2.836-1.559 3.033 0 3.604 1.994 3.604 4.589v5.602z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Important Links Section */}
        <div className="text-left md:text-right font-[var(--abhaya-sans)] text-xl lg:-translate-x-[50px]">
          <h2 className="text-xl font-semibold">Important Links</h2>
             <ul className="mt-2 flex flex-col gap-1.5 text-gray-300 text-lg  font-[var(--lancelot-sans)]">
        {['Return & Refund Policy', 'Privacy Policy', 'FAQ’s', 'Join As a Designer'].map((name, index) => {
          const linkPath = `/${name.toLowerCase().replace(/ /g, '-')}`;
          return (
            <li key={index} className="relative group">
              <Link href={linkPath} className="transition: hover:text-white "> 
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
        </div>

        {/* Contact Section */}
        <div className="text-left">
          <h2 className="text-xl  font-[var(--lancelot-sans)]">Contact Us</h2>
          <div className="mt-2 space-y-2">
            <p className="flex items-center gap-2"><MapPin /> <a href="https://www.google.com/maps/place/Kayapalat/@22.4935035,88.3891571,17z/data=!3m1!4b1!4m6!3m5!1s0x3a0271868dc12e59:0x509108582c6ccb4!8m2!3d22.4935035!4d88.391732!16s%2Fg%2F11vqzp8xlf?entry=ttu&g_ep=EgoyMDI1MDMxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" className="text-gray-300 hover:text-white ">179-A, Survey Park Rd, Purba Diganta, Santoshpur, Kolkata - 700075, WB, India</a></p>
            <p className="flex items-center gap-2"><Phone /> <a href="tel:6026026026" className="text-gray-300 hover:text-white">602-602-602-6</a></p>
            <p className="flex items-center gap-2"><Mail /> <a href="mailto:info@kayapalat.co" className="text-gray-300 hover:text-white">info@kayapalat.co</a></p>
          </div>
        </div>
        <div className="">
         <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3686.2845823891944!2d88.38915707537451!3d22.493503479548064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0271868dc12e59%3A0x509108582c6ccb4!2sKayapalat!5e0!3m2!1sen!2sin!4v1742228237886!5m2!1sen!2sin"  
           width="100%"  
          height="100%"  
          allowFullScreen  
          loading="lazy"  
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg "
          >
  </iframe>
</div>

      </div>
      

          {/* Footer Bottom */}
      <div className="mt-10 border-t border-gray-500 pt-4 text-center flex justify-between items-center">
        <Link href="/">
          <Image src="/logo-footer.png" alt="Kayapalat Logo" width={120} height={30} className="inline cursor-pointer md:ml-6" />
        </Link>
        <p className="text-[6px] md:text-[15px] inline">© All Rights Reserved | <Link href="/terms" className="hover:underline">Terms & Conditions Apply</Link></p>
      </div>
    </footer>
</div>
  );
};
   

export default Footer;