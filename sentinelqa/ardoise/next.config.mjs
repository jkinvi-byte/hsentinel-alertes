// Le jeton de vérification HSentinel se publie à l'adresse que la console relit ; il vient d'une variable d'environnement.
export default {
  async rewrites() {
    return [{ source: '/.well-known/hsentinel-verification.txt', destination: '/api/verification' }];
  },
};
