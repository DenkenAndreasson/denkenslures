import { z } from "zod";

// Tar emot "12345" och "123 45". Resultatet blir alltid "12345".
export const PostalCode = z
    .string()
    .trim()
    .regex(/^\d{3} ?\d{2}$/, "Ogiltigt postnummer")
    .transform((value) => value.replace(" ", ""));
