import { createApiHandler, withLogging, withValidation } from '../../src/lib/api-handler.ts';
import { supabase } from '../../src/lib/supabase.js';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ error: "Internal Server Error during login" });
    }
};

export default createApiHandler(handler, [
    withLogging,
    withValidation(loginSchema)
]);
