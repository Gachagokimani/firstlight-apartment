// backend/controllers/viewingController.js
import ViewingRequest from '../models/ViewingRequest.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import emailService from '../service/emailService.js';

export const createViewingRequest = async (req, res) => {
  try {
    const { listingId, preferredDate, message } = req.body;
    const requesterId = req.user.id;

    // Validate listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Get landlord details
    const landlord = await User.findById(listing.author_id);
    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: 'Landlord not found'
      });
    }

    // Get requester details
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for existing pending request
    const hasPending = await ViewingRequest.hasPendingRequest(requesterId, listingId);
    if (hasPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending viewing request for this property'
      });
    }

    // Create viewing request
    const newRequest = await ViewingRequest.create({
      listingId,
      requesterId,
      preferredDate,
      message
    });

    // Send email to landlord
    await emailService.sendViewingRequest(
      landlord.email,
      {
        landlordName: landlord.name,
        listingTitle: listing.title,
        listingLocation: listing.location,
        listingPrice: listing.price,
        tenantName: requester.name,
        tenantEmail: requester.email,
        tenantPhone: requester.phone,
        preferredDate: newRequest.preferred_date,
        message: newRequest.message,
        dashboardLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    // Get populated request for response
    const populatedRequest = await ViewingRequest.findById(newRequest.id);

    res.status(201).json({
      success: true,
      message: 'Viewing request submitted successfully',
      request: populatedRequest
    });

  } catch (error) {
    console.error('Error creating viewing request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating viewing request',
      error: error.message
    });
  }
};

export const updateViewingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, landlordMessage } = req.body;
    const respondedBy = req.user.id;

    // Get current request with populated data
    const currentRequest = await ViewingRequest.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Viewing request not found'
      });
    }

    // Update viewing request
    const updatedRequest = await ViewingRequest.update(requestId, {
      status,
      landlordMessage,
      respondedBy
    });

    // Send confirmation email to tenant
    await emailService.sendViewingRequestConfirmation(
      currentRequest.requester_email,
      {
        tenantName: currentRequest.requester_name,
        listingTitle: currentRequest.listing_title,
        listingLocation: currentRequest.listing_location,
        preferredDate: currentRequest.preferred_date,
        status: status,
        landlordName: currentRequest.landlord_name,
        landlordEmail: currentRequest.landlord_email,
        landlordPhone: currentRequest.landlord_phone,
        landlordMessage: landlordMessage
      }
    );

    // Update user stats if approved/declined
    if (status === 'approved' || status === 'declined') {
      const landlord = await User.findById(respondedBy);
      if (landlord && landlord.stats) {
        const newStats = {
          ...landlord.stats,
          respondedRequests: (landlord.stats.respondedRequests || 0) + 1
        };
        await User.updateStats(respondedBy, newStats);
      }
    }

    res.json({
      success: true,
      message: `Viewing request ${status}`,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error updating viewing request:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating viewing request',
      error: error.message
    });
  }
};

export const getViewingRequests = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const requests = await ViewingRequest.findByOwnerId(ownerId);
    
    res.json({
      success: true,
      requests
    });
    
  } catch (error) {
    console.error('Error fetching viewing requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching viewing requests',
      error: error.message
    });
  }
};