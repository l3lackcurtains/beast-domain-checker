import type { APIRoute } from 'astro';
import { getFavorites, addFavorite, removeFavorite, updateFavoriteNotes } from '../../lib/storage';

// GET - Get all favorites
export const GET: APIRoute = async () => {
  try {
    const favorites = await getFavorites();
    
    return new Response(
      JSON.stringify({ favorites }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get favorites' }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// POST - Add a favorite
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await addFavorite({
      domain: body.domain,
      status: body.status || 'available',
      price: body.price,
      available: body.available ?? true,
      addedAt: new Date().toISOString(),
      notes: body.notes || ''
    });

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to add favorite' 
      }), 
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// DELETE - Remove a favorite
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await removeFavorite(body.domain);

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to remove favorite' }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// PATCH - Update favorite notes
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateFavoriteNotes(body.domain, body.notes || '');

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update notes' }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
