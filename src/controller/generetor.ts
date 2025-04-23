import { prisma } from "../client.js";
import { fill_franchise } from "../helper.js";
import { Request, Response } from "express";

export async function generate_franchise(req: Request, res: Response) {
  const enq = req.body.selectedNotification;
  const certificateLink = await fill_franchise(enq);

  await prisma.enquiry.update({
    where: {
      id: enq.id,
    },
    data: {
      certificateLink,
    },
  });
  res.json({ success: true });
}
