import messageModel from "../../../DB/models/user/Message.model.js";
import { systemRoles } from "../utils/system-roles.js";

export const addMessage = async (req, res, next) => {
  const { name, email, description } = req.body;

  const task = await messageModel.create({
    name,
    email,
    description,
  });

  return res.json({
    success: true,
    message: "Message Sent successfully",
    task,
  });
};

export const getAllMessages = async (req, res, next) => {
  try {
    const messages = await messageModel.find();

    return messages.length
      ? res.json({ success: true, messages })
      : res.json({ success: false, message: "no posts" });
  } catch (error) {
    return res.json({ success: false, err: error.message });
  }
};

export const deleteMessage = async (req, res, next) => {
  const { id } = req.params;
  if (req.user.role !== systemRoles.SUPER_ADMIN)
    return next({
      cause: 403,
      message: "You are not authorized ",
    });
  const message = await messageModel.findById(id);
  if (!message) {
    return next(new Error("No message with this id", { cause: 404 }));
  }
  const deleteMessage = await messageModel.findByIdAndDelete(id);
  if (!deleteMessage)
    return next(new Error(`There's no message with this id`, { cause: 400 }));

  return res.json({
    success: true,
    message: "Message Deleted Successfully",
  });
};
