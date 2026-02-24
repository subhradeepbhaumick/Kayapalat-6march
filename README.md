# Kayapalat - Business Management Platform

A comprehensive business management platform built with Next.js, TypeScript, and MySQL, designed to streamline operations for business brands, dealers, and agents in the Indian market.

## 🚀 Features

### Business Brand Dashboard
- **Onboarding System**: Complete business profile setup with required fields (Company Name, Address, Owner Name, Phone, PAN)
- **Dashboard Overview**: Real-time statistics and activity monitoring
- **Product Management**: Add and manage product listings
- **Order Management**: Track and manage business orders
- **Profile Management**: Update business information and settings

### Multi-Role Architecture
- **Business Brands**: Manufacturers and brand owners
- **Dealers**: Distributors and resellers
- **Agents**: Sales representatives and field agents

### Security & Authentication
- NextAuth.js integration for secure authentication
- Role-based access control
- JWT token management
- Session handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **State Management**: React Hooks
- **UI Components**: Custom components with responsive design

## 📋 Prerequisites

- Node.js 18.x or higher
- MySQL 8.0 or higher
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kayapalat
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=kayapalat_db

   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_key
   NEXTAUTH_URL=http://localhost:3000

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   - Create a MySQL database named `kayapalat_db`
   - Run the database migrations/schema setup (refer to database schema files)

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
kayapalat/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── businessBrand/     # Business brand APIs
│   │   │   ├── dealer/            # Dealer APIs
│   │   │   └── users/             # User management APIs
│   │   ├── businessBrand/         # Business brand pages
│   │   ├── dealer/               # Dealer pages
│   │   ├── agent/                # Agent pages
│   │   └── globals.css           # Global styles
│   ├── components/               # Reusable components
│   ├── lib/                      # Utility functions
│   │   ├── db.ts                 # Database connection
│   │   └── auth.ts               # Authentication utilities
│   └── middleware.ts             # Next.js middleware
├── public/                       # Static assets
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.js               # Next.js configuration
└── package.json                 # Dependencies and scripts
```

## 🔐 Authentication Flow

1. **Registration**: Users register with role selection (Business Brand/Dealer/Agent)
2. **Email Verification**: Account activation via email
3. **Login**: Secure authentication with NextAuth.js
4. **Role-based Redirect**: Automatic redirection based on user role
5. **Onboarding**: Required profile completion for business brands

## 🎯 Key Workflows

### Business Brand Onboarding
1. User logs in as business brand
2. Onboarding modal appears if required fields are missing
3. Must fill: Company Name, Address, Owner Name, Phone, PAN
4. Optional: GSTIN, TAN
5. Dashboard access granted after completion

### Dashboard Features
- Real-time statistics display
- Activity monitoring
- Product listing management
- Order tracking
- Profile updates

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://yourdomain.com
DB_HOST=your_production_db_host
DB_USER=production_db_user
DB_PASSWORD=production_db_password
DB_NAME=production_db_name
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User logout

### Business Brand Endpoints
- `GET /api/businessBrand/profile` - Get profile data
- `POST /api/businessBrand/onboarding` - Complete onboarding
- `PUT /api/businessBrand/onboarding` - Update profile

### Dealer Endpoints
- `GET /api/dealer/profile` - Get dealer profile
- `POST /api/dealer/onboarding` - Dealer onboarding

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful component and variable names
- Implement proper error handling

### Database Schema
- Use migrations for schema changes
- Maintain referential integrity
- Optimize queries for performance

### Security Best Practices
- Validate all user inputs
- Use parameterized queries
- Implement proper session management
- Regular security audits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 📈 Roadmap

- [ ] Mobile application development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Automated testing suite
- [ ] Performance optimization
- [ ] Third-party integrations

---

**Built with ❤️ for the Indian business community**
