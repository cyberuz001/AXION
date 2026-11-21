export const themeKey = "axion-theme";
export const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("${themeKey}")==="dark"?"dark":"light"}catch{}`;
