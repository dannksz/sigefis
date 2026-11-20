"use client";

import Image from "next/image";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-800 border-t border-gray-300 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="relative w-32 h-10">
              <div className="text-2xl font-bold text-gray-800">HALL OF JERSEYS</div>
            </div>

            <nav>
              <ul className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-medium">
                <li><a href="#" className="hover:underline">NBA</a></li>
                <li><a href="#" className="hover:underline">NFL</a></li>
                <li><a href="#" className="hover:underline">MLS</a></li>
                <li><a href="#" className="hover:underline">NHL</a></li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center md:items-end w-full md:w-auto">
            <label
              htmlFor="footer-email"
              className="text-sm font-medium mb-2 text-center md:text-right"
            >
              Newsletter
            </label>
            <div className="flex justify-center md:justify-end w-full sm:w-auto">
              <input
                id="footer-email"
                type="email"
                placeholder="Seu e-mail"
                className="px-3 py-2 rounded-l-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-r-md text-sm hover:bg-primary-dark">
                Inscrever-se
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 my-6" />

        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 text-center">
          <a href="#" className="hover:underline">Quem somos?</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Política de privacidade</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Acessibilidade</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Contato</a>
        </div>
      </div>
    </footer>
  );
}