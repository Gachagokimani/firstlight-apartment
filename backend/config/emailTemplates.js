// backend/config/emailConfig.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Base template wrapper
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f7fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
    ${content}
  </div>
</body>
</html>
`;

// Header component
const headerTemplate = (title, subtitle, gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') => `
<div style="background: ${gradient}; color: white; padding: 30px 20px; text-align: center;">
  <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">FirstLight Apartments</h1>
  <h2 style="margin: 0; font-size: 20px; font-weight: 400; opacity: 0.9;">${title}</h2>
  ${subtitle ? `<p style="margin: 10px 0 0 0; opacity: 0.8;">${subtitle}</p>` : ''}
</div>
`;

// Content wrapper
const contentTemplate = (content) => `
<div style="padding: 30px;">
  ${content}
</div>
`;

// Button component
const buttonTemplate = (text, url, color = '#667eea') => `
<div style="text-align: center; margin: 25px 0;">
  <a href="${url}" style="display: inline-block; padding: 14px 32px; background: ${color}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
    ${text}
  </a>
</div>
`;

// Info card component
const infoCardTemplate = (title, items) => `
<div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">${title}</h3>
  ${items.map(item => `
    <p style="margin: 8px 0; color: #4a5568;">
      <strong style="color: #2d3748;">${item.label}:</strong> ${item.value}
    </p>
  `).join('')}
</div>
`;

// Status badge component
const statusBadgeTemplate = (status, isApproved = true) => {
  const colors = isApproved 
    ? { background: '#c6f6d5', color: '#22543d', text: 'APPROVED' }
    : { background: '#fed7d7', color: '#742a2a', text: 'DECLINED' };
  
  return `
  <div style="text-align: center; margin: 25px 0;">
    <div style="display: inline-block; padding: 12px 24px; background: ${colors.background}; color: ${colors.color}; border-radius: 25px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
      ${colors.text}
    </div>
  </div>
  `;
};

// Email templates
export const emailTemplates = {
  // Viewing Request to Landlord
  viewingRequest: (data) => {
    const content = `
      ${headerTemplate('New Viewing Request', 'Someone wants to visit your property!')}
      ${contentTemplate(`
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
          Hello <strong style="color: #2d3748;">${data.landlordName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
          Great news! You have received a new viewing request for your property. 
          A potential tenant is interested in scheduling a visit.
        </p>

        ${infoCardTemplate('Property Details', [
          { label: 'Listing', value: data.listingTitle },
          { label: 'Location', value: data.listingLocation },
          { label: 'Price', value: `$${data.listingPrice}/month` },
          { label: 'Requested Date', value: new Date(data.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
        ])}

        ${infoCardTemplate('Tenant Information', [
          { label: 'Name', value: data.tenantName },
          { label: 'Email', value: data.tenantEmail },
          { label: 'Phone', value: data.tenantPhone || 'Not provided' }
        ])}

        ${infoCardTemplate('Message from Tenant', [
          { label: '', value: `"${data.message}"` }
        ])}

        ${buttonTemplate('Manage Viewing Request', data.dashboardLink, '#48bb78')}

        <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
            You can also respond directly to the tenant at 
            <a href="mailto:${data.tenantEmail}" style="color: #667eea; text-decoration: none;">${data.tenantEmail}</a>
          </p>
        </div>
      `)}
    `;

    return {
      subject: `🏠 New Viewing Request - ${data.listingTitle}`,
      html: baseTemplate(content, 'New Viewing Request - FirstLight Apartments')
    };
  },

  // Viewing Request Confirmation to Tenant
  viewingRequestConfirmation: (data) => {
    const isApproved = data.status === 'approved';
    const gradient = isApproved 
      ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
      : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';

    const content = `
      ${headerTemplate(
        `Viewing Request ${isApproved ? 'Approved' : 'Declined'}`,
        `Your request has been ${data.status}`,
        gradient
      )}
      ${contentTemplate(`
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
          Hello <strong style="color: #2d3748;">${data.tenantName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
          The property owner has ${data.status} your viewing request.
          ${isApproved ? 'You can now proceed with scheduling the visit.' : 'You can explore other available properties.'}
        </p>

        ${statusBadgeTemplate(data.status, isApproved)}

        ${infoCardTemplate('Property Details', [
          { label: 'Listing', value: data.listingTitle },
          { label: 'Location', value: data.listingLocation },
          { label: 'Requested Date', value: new Date(data.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
        ])}

        ${infoCardTemplate('Landlord Information', [
          { label: 'Name', value: data.landlordName },
          { label: 'Email', value: data.landlordEmail },
          { label: 'Phone', value: data.landlordPhone || 'Not provided' }
        ])}

        ${data.landlordMessage ? infoCardTemplate('Message from Landlord', [
          { label: '', value: `"${data.landlordMessage}"` }
        ]) : ''}

        ${isApproved ? `
          <div style="background: #ebf8ff; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #4299e1;">
            <h4 style="margin: 0 0 10px 0; color: #2b6cb0;">Next Steps</h4>
            <p style="margin: 5px 0; color: #2c5282; font-size: 14px;">
              1. Contact the landlord to confirm the viewing time<br>
              2. Prepare any questions you have about the property<br>
              3. Bring necessary documents if you're ready to apply
            </p>
          </div>
        ` : `
          <div style="background: #fff5f5; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f56565;">
            <h4 style="margin: 0 0 10px 0; color: #c53030;">Don't worry!</h4>
            <p style="margin: 5px 0; color: #742a2a; font-size: 14px;">
              There are plenty of other great properties available. 
              Continue your search to find the perfect home for you.
            </p>
          </div>
        `}

        ${buttonTemplate(
          isApproved ? 'Contact Landlord' : 'Browse More Properties',
          isApproved ? `mailto:${data.landlordEmail}` : `${data.clientUrl}/search`,
          isApproved ? '#48bb78' : '#667eea'
        )}
      `)}
    `;

    return {
      subject: `📅 Viewing Request ${isApproved ? 'Approved' : 'Declined'} - ${data.listingTitle}`,
      html: baseTemplate(content, `Viewing Request ${data.status} - FirstLight Apartments`)
    };
  },

  // New Listing Confirmation
  listingCreated: (data) => {
    const content = `
      ${headerTemplate('Listing Published!', 'Your property is now live', 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)')}
      ${contentTemplate(`
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
          Hello <strong style="color: #2d3748;">${data.landlordName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
          Congratulations! Your property listing has been published and is now visible to potential tenants.
        </p>

        ${infoCardTemplate('Listing Details', [
          { label: 'Title', value: data.listingTitle },
          { label: 'Location', value: data.listingLocation },
          { label: 'Price', value: `$${data.listingPrice}/month` },
          { label: 'Property Type', value: data.propertyType },
          { label: 'Bedrooms', value: data.bedrooms },
          { label: 'Bathrooms', value: data.bathrooms },
          { label: 'Area', value: `${data.area} sq ft` }
        ])}

        <div style="background: #f0fff4; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #48bb78;">
          <h4 style="margin: 0 0 10px 0; color: #22543d;">What's Next?</h4>
          <p style="margin: 5px 0; color: #22543d; font-size: 14px;">
            • You'll receive email notifications when tenants request viewings<br>
            • Respond promptly to viewing requests to increase chances of renting<br>
            • Keep your listing updated with any changes
          </p>
        </div>

        ${buttonTemplate('View Your Listing', data.listingUrl, '#ed8936')}
        ${buttonTemplate('Manage Listings', data.dashboardUrl, '#667eea')}

        <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
            Need help? Contact our support team at 
            <a href="mailto:support@firstlight.com" style="color: #667eea; text-decoration: none;">support@firstlight.com</a>
          </p>
        </div>
      `)}
    `;

    return {
      subject: `🎉 Your Listing is Live - ${data.listingTitle}`,
      html: baseTemplate(content, 'Listing Published - FirstLight Apartments')
    };
  },

  // Contact Landlord
  contactLandlord: (data) => {
    const content = `
      ${headerTemplate('New Contact Message', 'Someone is interested in your property', 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)')}
      ${contentTemplate(`
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
          Hello <strong style="color: #2d3748;">${data.landlordName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
          You have received a new message from someone interested in your property listing.
        </p>

        ${infoCardTemplate('Property Information', [
          { label: 'Listing', value: data.listingTitle },
          { label: 'Location', value: data.listingLocation }
        ])}

        ${infoCardTemplate('Contact Details', [
          { label: 'Name', value: data.contactName },
          { label: 'Email', value: data.contactEmail },
          { label: 'Phone', value: data.contactPhone || 'Not provided' }
        ])}

        ${infoCardTemplate('Message', [
          { label: '', value: `"${data.message}"` }
        ])}

        ${buttonTemplate('Reply via Email', `mailto:${data.contactEmail}`, '#9f7aea')}

        <div style="background: #faf5ff; border-radius: 10px; padding: 15px; margin: 20px 0; border: 1px solid #e9d8fd;">
          <p style="margin: 0; color: #6b46c1; font-size: 14px; text-align: center;">
            💡 <strong>Tip:</strong> Respond within 24 hours to increase your chances of renting the property.
          </p>
        </div>
      `)}
    `;

    return {
      subject: `📩 New Message About ${data.listingTitle}`,
      html: baseTemplate(content, 'New Contact Message - FirstLight Apartments')
    };
  },

  // Welcome Email for New Users
  welcomeEmail: (data) => {
    const content = `
      ${headerTemplate('Welcome to FirstLight!', 'Your journey to finding the perfect home begins now', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}
      ${contentTemplate(`
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
          Hello <strong style="color: #2d3748;">${data.userName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
          Welcome to FirstLight Apartments! We're excited to help you find your perfect rental property 
          or connect with potential tenants for your listings.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 25px 0;">
          <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 10px;">
            <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
            <h4 style="margin: 0 0 10px 0; color: #2d3748;">Search Properties</h4>
            <p style="margin: 0; color: #718096; font-size: 14px;">Browse thousands of rental listings</p>
          </div>
          <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 10px;">
            <div style="font-size: 24px; margin-bottom: 10px;">📅</div>
            <h4 style="margin: 0 0 10px 0; color: #2d3748;">Schedule Viewings</h4>
            <p style="margin: 0; color: #718096; font-size: 14px;">Book property visits easily</p>
          </div>
        </div>

        ${buttonTemplate('Start Exploring', data.clientUrl, '#667eea')}

        <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 14px; color: #718096; text-align: center; margin: 0 0 10px 0;">
            Need help getting started?
          </p>
          <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
            Contact us: <a href="mailto:support@firstlight.com" style="color: #667eea; text-decoration: none;">support@firstlight.com</a>
          </p>
        </div>
      `)}
    `;
        
    return {
      subject: `👋 Welcome to FirstLight Apartments!`,
      html: baseTemplate(content, 'Welcome to FirstLight Apartments')
    };
  }
};

// OTP Templates
export const otpTemplates = {
  emailVerification: (data) => ({
    subject: `🔐 Verify Your Email - FirstLight Apartments`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">FirstLight Apartments</h1>
          <h2 style="margin: 0; font-size: 20px; font-weight: 400; opacity: 0.9;">Email Verification</h2>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
            Hello <strong style="color: #2d3748;">${data.userName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
            Thank you for signing up! Use the following OTP to verify your email address and complete your registration.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; box-shadow: 0 8px 20px rgba(72, 187, 120, 0.3);">
              ${data.otp}
            </div>
          </div>

          <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Important Information:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
              <li>This OTP is valid for <strong>10 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>

          <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
            <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
              Need help? Contact our support team at 
              <a href="mailto:support@firstlight.com" style="color: #667eea; text-decoration: none;">support@firstlight.com</a>
            </p>
          </div>
        </div>
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: `🔄 Password Reset Request - FirstLight Apartments`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">FirstLight Apartments</h1>
          <h2 style="margin: 0; font-size: 20px; font-weight: 400; opacity: 0.9;">Password Reset</h2>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
            Hello <strong style="color: #2d3748;">${data.userName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
            We received a request to reset your password. Use the following OTP to proceed with resetting your password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; box-shadow: 0 8px 20px rgba(237, 137, 54, 0.3);">
              ${data.otp}
            </div>
          </div>

          <div style="background: #fff5f5; border-radius: 10px; padding: 15px; margin: 20px 0; border: 1px solid #fed7d7;">
            <p style="margin: 0; color: #742a2a; font-size: 14px; text-align: center;">
              ⚠️ <strong>Security Notice:</strong> This OTP will expire in 10 minutes. If you didn't request a password reset, please secure your account.
            </p>
          </div>

          <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
            <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
              For security questions, contact 
              <a href="mailto:security@firstlight.com" style="color: #667eea; text-decoration: none;">security@firstlight.com</a>
            </p>
          </div>
        </div>
      </div>
    `
  }),

  twoFactorAuth: (data) => ({
    subject: `🔒 Two-Factor Authentication Code - FirstLight Apartments`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">FirstLight Apartments</h1>
          <h2 style="margin: 0; font-size: 20px; font-weight: 400; opacity: 0.9;">2FA Verification</h2>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
            Hello <strong style="color: #2d3748;">${data.userName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
            Your two-factor authentication code is below. Enter this code to complete your login.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; box-shadow: 0 8px 20px rgba(159, 122, 234, 0.3);">
              ${data.otp}
            </div>
          </div>

          <div style="background: #faf5ff; border-radius: 10px; padding: 15px; margin: 20px 0; border: 1px solid #e9d8fd;">
            <p style="margin: 0; color: #6b46c1; font-size: 14px; text-align: center;">
              🔐 <strong>Security Code:</strong> This code expires in 5 minutes for your protection.
            </p>
          </div>

          <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
            <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
              If this wasn't you, please secure your account immediately.
            </p>
          </div>
        </div>
      </div>
    `
  })
};

export default transporter;