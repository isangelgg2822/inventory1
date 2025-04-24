import { createClient } from '@supabase/supabase-js';

// Reemplaza con la URL de tu proyecto y la clave service_role
const SUPABASE_URL = 'https://ofifakjwgsypbmhjdror.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maWZha2p3Z3N5cGJtaGpkcm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDEyMTI1MCwiZXhwIjoyMDU5Njk3MjUwfQ.UyjLOP8SDnq1Qd9h7f5Em4NJ_9nCw_Kgqw6dFgC_eL8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lista de usuarios y sus roles
const usersToUpdate = [
    {
      id: 'e0022b6a-4d1d-4a72-88d9-e77b562fa17e', // isangel.gonzalez@gmail.com
      email: 'isangel.gonzalez1@gmail.com',
      role: 'user'
    },
    {
      id: '21775d2f-eebb-4c8c-a015-8d1126b85829', // isangel2282@gmail.com
      email: 'isangel2282@gmail.com',
      role: 'admin'
    },
    {
      id: 'd81c8895-c501-42bd-acc4-6da77abdc1a1', // dxtodito@gmail.com
      email: 'dxtodito@gmail.com',
      role: 'user'
    },
    {
      id: '8071e08e-d0a3-4cba-99b1-3bfefabc4185', // isangelkin@gmail.com
      email: 'isangelkin@gmail.com',
      role: 'admin'
    },
    {
      id: '69edc974-8d11-49ec-8421-d8e7c168ebd9', // stylesdix@gmail.com
      email: 'stylesdix@gmail.com',
      role: 'admin'
    }
  ];
  
  async function updateUserRoles() {
    for (const user of usersToUpdate) {
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            sub: user.id,
            email: user.email,
            email_verified: true,
            phone_verified: false,
            role: user.role
          }
        }
      );
  
      if (error) {
        console.error(`Error updating user ${user.id}:`, error);
      } else {
        console.log(`Updated user ${user.id} with role ${user.role}`, data);
      }
    }
  }
  
  updateUserRoles();