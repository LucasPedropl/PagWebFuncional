let tempCompanyLogo: File | null = null;

export const fileCache = {
  setCompanyLogo(file: File | null) {
    tempCompanyLogo = file;
  },
  getCompanyLogo(): File | null {
    const file = tempCompanyLogo;
    // Opcionalmente limpa após o consumo para evitar vazamento de memória
    tempCompanyLogo = null;
    return file;
  }
};
