# 🌿 HerbChain Traceability MVP

A blockchain-based traceability system for Ayurvedic herbs that tracks products from farm to consumer, ensuring authenticity and quality throughout the supply chain.

## 🚀 Features

### 👨‍🌾 **Farmer Interface**
- Create and manage herb batches
- Track batch status and timeline
- View detailed batch information with photos and location
- Resubmit rejected batches

### 🧪 **Lab Officer Interface**
- Review pending batches
- Approve or reject batches with detailed reasons
- Quality assessment guidelines
- Batch filtering and search

### 🏭 **Manufacturer Interface**
- Process approved batches
- Generate QR codes for consumer verification
- Track manufacturing timeline
- Add processing notes

### 👤 **Consumer Interface**
- Verify batch authenticity via QR code or batch ID
- View complete supply chain journey
- Access scan history
- Learn about HerbChain and quality standards

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS + Custom Components
- **Routing**: React Router v6
- **State Management**: React Context + Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **QR Codes**: qrcode.react
- **Date Handling**: Day.js
- **Storage**: localStorage (mock backend)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd herbchain-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Demo Accounts

### Farmer
- **Username**: `farmer123`
- **Password**: `password123`

### Lab Officer
- **Username**: `lab123`
- **Password**: `password123`

### Manufacturer
- **Username**: `manufacturer123`
- **Password**: `password123`

### Consumer
- **Access**: No login required (guest mode)

## 📱 Sample Batch IDs

Try these batch IDs in the consumer interface:
- `ASH-2025-001` - Pending batch
- `TUL-2025-002` - Approved batch
- `TUR-2025-003` - Processed batch (full journey)

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components by role
│   ├── auth/           # Authentication pages
│   ├── farmer/         # Farmer interface
│   ├── lab/            # Lab officer interface
│   ├── manufacturer/   # Manufacturer interface
│   └── consumer/       # Consumer interface
├── layouts/            # Layout components
├── context/            # React Context providers
├── services/           # Data services and API
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── config/             # Configuration constants
```

## 🎨 Design System

### Colors
- **Primary**: Green (#22C55E) - Actions, success states
- **Accent**: Dark Green (#15803D) - Headers, emphasis
- **Warning**: Yellow (#EAB308) - Pending states
- **Error**: Red (#EF4444) - Rejected states, errors
- **Processing**: Orange (#F97316) - Manufacturing states

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Primary (green), secondary (gray), danger (red)
- **Status Badges**: Color-coded with emojis
- **Forms**: Real-time validation, clear error states

## 🔄 Data Flow

1. **Farmer** creates batch → Status: Pending
2. **Lab Officer** reviews → Status: Approved/Rejected
3. **Manufacturer** processes → Status: Processed + QR Code
4. **Consumer** verifies → View complete journey

## 📊 Mock Data

The application includes comprehensive mock data:
- Pre-populated batches in different states
- Realistic farmer, lab, and manufacturer data
- Sample photos and locations
- Complete timeline tracking

## 🔒 Security Features

- Role-based access control
- Input validation and sanitization
- XSS protection through React
- Secure localStorage implementation

## 📱 Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interfaces
- Progressive Web App (PWA) ready

## 🚀 Performance

- Lazy loading of components
- Optimized bundle size with Vite
- Efficient state management
- Debounced search inputs
- Image optimization

## 🧪 Testing

The application includes:
- Form validation testing
- Error boundary implementation
- Loading state management
- Accessibility features (ARIA labels, keyboard navigation)

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📈 Future Enhancements

- Real blockchain integration
- Advanced analytics dashboard
- Multi-language support
- Push notifications
- Offline synchronization
- Advanced search and filtering
- Batch comparison tools
- Supply chain analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@herbchain.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

---

**Built with ❤️ for the Ayurvedic herb supply chain community**