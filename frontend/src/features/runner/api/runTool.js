import axios from "axios";

export async function runTool(input, options) {
  const response = await axios.post("/api/run", { input, options });
  return response.data;
}
