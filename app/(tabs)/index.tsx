const handleOpenStore = useCallback(async (url: string) => {
if (!url || typeof url !== 'string') {
Alert.alert(
'Link non disponibile',
'Questo negozio non ha un link diretto.'
);
return;
}

let storeUrl = url.trim();

if (!storeUrl) {
Alert.alert(
'Link non disponibile',
'Questo negozio non ha un link diretto.'
);
return;
}

if (!/^https?:///i.test(storeUrl)) {
storeUrl = `https://${storeUrl}`;
}

try {
await Linking.openURL(storeUrl);
} catch (error) {
console.error('[TRUTH] Errore apertura negozio:', error);


Alert.alert(
  'Impossibile aprire il negozio',
  'Non è stato possibile aprire il link del negozio.'
);


}
}, []);
