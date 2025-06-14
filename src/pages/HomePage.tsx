import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Users, Search, Heart } from 'lucide-react';
import ItemList from '../components/Items/ItemList';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Recycle className="h-16 w-16 text-yellow-300" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to
              <span className="text-yellow-300"> OpenCycle</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-teal-100 max-w-3xl mx-auto">
              Connect with your community and give your unused items a new home. 
              One person's treasure is another's treasure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth?mode=register"
                className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Giving Today
              </Link>
              <Link
                to="#browse"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-teal-600 transition-colors"
              >
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How OpenCycle Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start sharing and receiving items in your community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-200 transition-colors">
                <Recycle className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">List Your Items</h3>
              <p className="text-gray-600">
                Take a photo and add details about items you'd like to give away. 
                It only takes a few minutes.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Find Treasures</h3>
              <p className="text-gray-600">
                Browse through items in your area or search for something specific. 
                Discover amazing finds for free.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect & Share</h3>
              <p className="text-gray-600">
                Message item owners and arrange pickup. Build connections while 
                helping the environment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div id="browse" className="py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Available Items
          </h2>
          <p className="text-xl text-gray-600">
            Discover items your neighbors are sharing
          </p>
        </div>
        <ItemList />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Heart className="w-16 h-16 mx-auto mb-6 text-teal-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Join thousands of people who are building stronger, more sustainable communities 
            through the simple act of sharing.
          </p>
          <Link
            to="/auth?mode=register"
            className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg inline-block"
          >
            Join OpenCycle Community
          </Link>
        </div>
      </div>

      {/* Footer Attribution */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              A project made by <span className="text-white font-medium">Abhishek</span> and <span className="text-white font-medium">Ravi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;