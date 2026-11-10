export default function launchInterestLimit() {
  // Sem resposta própria, a Netlify continua até a rota do Next.js.
}

export const config = {
  path: "/resumos/api/launch-interest",
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
