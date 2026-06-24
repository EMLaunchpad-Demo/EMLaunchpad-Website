/* ============================================================================
   EM Launchpad — GLOBAL JS for GoHighLevel.
   If your GHL plan has a dedicated "Custom JS" field, paste this file
   there as-is. If you only see "Head tracking code" / "Body tracking
   code" under Settings -> Tracking en scripts (that field accepts raw
   HTML, not bare JS), use body-trackingcode.html instead — it's this
   exact content already wrapped in <script>...</script>, ready to paste
   into the Body tracking code box (loads right before </body>).
   It is i18n.js + i18n-pages.js + site.js concatenated, in
   that exact order — site.js calls window.EMi18n.init(), so i18n must load
   first.

   ONLY site.js (the last section) was edited for GoHighLevel. Changes:
   - Added a CONFIG block (PAGES slugs + LOGO_URL) near the top of the
     site.js section below — edit those two things for your GHL setup.
   - Nav "active link" highlighting now reads window.location.pathname
     instead of <body data-page="...">, because GHL controls <body> and we
     can't set a custom attribute on it from a pasted code block.
   - Internal-link detection (for the page-transition fade effect) now
     matches root-relative paths ("/contact") instead of "*.html" filenames.
   ============================================================================ */

/* EMLaunchpad — site-wide i18n (NL · FR · EN).
   Text-node walker keyed on the original Dutch string. Stores each node's
   original NL value once, then swaps to FR/EN from the dictionary (or restores
   NL). Persists the choice in localStorage. site.js calls EMi18n.init() after
   it injects the nav + footer so the whole page (chrome included) is covered. */
(function () {
  const LANGS = ['nl', 'fr', 'en'];
  const KEY = 'em_lang';

  // ── DICTIONARY ─────────────────────────────────────────────────────────
  // Keyed on the trimmed Dutch text fragment. Gradient spans split sentences,
  // so headline fragments are listed separately (that's intentional).
  const T = {
    fr: {
      /* nav + footer chrome */
      'home': 'accueil', 'diensten': 'services', 'blog': 'blog', 'over_ons': 'à_propos',
      'contact': 'contact', 'live_demo': 'démo_live', 'gratis_demo': 'démo_gratuite', 'plan_een_gesprek': 'planifier_appel',
      'bedrijf': 'entreprise', 'nieuwsbrief': 'newsletter', 'subscribe': "s'inscrire",
      'all_systems_online // 24/7': 'tous_systèmes_en_ligne // 24/7',
      'Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.':
        "Agence IA belge du Limbourg. Nous créons des sites web, chatbots, agents vocaux et automatisations qui font grandir les entreprises locales.",
      'ai chatbots': 'chatbots ia', 'ai voice agents': 'agents vocaux ia', 'websites': 'sites web',
      'ai-automatisering': 'automatisation ia', 'reputatiebeheer': 'e-réputation',
      'crm & dashboard': 'crm & tableau de bord', 'email & sms': 'email & sms',
      "funnels & landingspagina's": "tunnels & pages d'atterrissage",
      'Brugstraat 2A, 3870 Vechmaal, België': 'Brugstraat 2A, 3870 Vechmaal, Belgique',
      '// lokaal_actief →': '// actif_localement →', 'Heel Limburg & België': 'Tout le Limbourg & la Belgique',
      'GEMAAKT_IN_LIMBURG': 'CRÉÉ_AU_LIMBOURG', 'BELGIË': 'BELGIQUE',
      'jouw@email.be': 'votre@email.be',

      /* ── HOME ── */
      'Gebouwd voor Belgische lokale bedrijven': 'Conçu pour les entreprises locales belges',
      '· Vertrouwd door Belgische ondernemers': "· Approuvé par les entrepreneurs belges",
      'De stille kracht achter': 'La force tranquille derrière',
      'groeiende Belgische bedrijven.': 'les entreprises belges en croissance.',
      'Wij bouwen websites, AI chatbots, voice agents en automatisaties die voor jou werken — terwijl jij focust op je vak. Eén systeem. Eén dashboard. Geen chaos.':
        "Nous créons des sites web, chatbots IA, agents vocaux et automatisations qui travaillent pour vous — pendant que vous vous concentrez sur votre métier. Un système. Un tableau de bord. Zéro chaos.",
      'Live binnen 14 dagen': 'En ligne en 14 jours', '100% op maat': '100% sur mesure',
      'Geen technische kennis nodig': 'Aucune connaissance technique requise', 'Persoonlijk contact': 'Contact personnel',
      'Plan een gratis gesprek': 'Planifiez un appel gratuit', 'Bekijk onze cases': 'Voir nos cas',
      'EM Launchpad AI': 'EM Launchpad IA', 'Online — antwoordt direct': 'En ligne — répond aussitôt',
      'Hallo! Waarvoor wil je een afspraak?': 'Bonjour ! Pour quoi souhaitez-vous un rendez-vous ?',
      'Een knipbeurt komende week': 'Une coupe la semaine prochaine',
      'Donderdag 14:30 vrij — past dat?': 'Jeudi 14h30 est libre — cela vous convient ?',
      'Afspraken · Vandaag': 'Rendez-vous · Aujourd’hui', 'Automatisch': 'Automatique', 'ingepland': 'planifié',
      'Nieuwe review': 'Nouvel avis', '"Top service!"': '« Service au top ! »', '5 minuten geleden': 'il y a 5 minutes',
      'Diensten': 'Services', 'Eén partner.': 'Un seul partenaire.', 'Vijf systemen.': 'Cinq systèmes.',
      'Geen losse tools die elkaar tegenwerken. Geen drie verschillende leveranciers. Alles draait in één geïntegreerde omgeving die voor jou werkt.':
        "Pas d'outils dispersés qui se contredisent. Pas de trois fournisseurs différents. Tout tourne dans un environnement intégré qui travaille pour vous.",
      'AI Chatbots': 'Chatbots IA',
      'Beantwoorden vragen, kwalificeren leads en boeken afspraken — op je website, WhatsApp, Instagram en Messenger.':
        'Répondent aux questions, qualifient les leads et prennent des rendez-vous — sur votre site, WhatsApp, Instagram et Messenger.',
      'Ontdek chatbots': 'Découvrir les chatbots',
      'AI Voice Agents': 'Agents vocaux IA',
      'Mensachtige stem die elke oproep aanneemt, vragen beantwoordt en afspraken inplant — 24/7, in meerdere talen.':
        'Une voix humaine qui décroche chaque appel, répond aux questions et planifie des rendez-vous — 24/7, en plusieurs langues.',
      'Ontdek voice agents': 'Découvrir les agents vocaux',
      'Websites': 'Sites web',
      'Snelle, moderne websites met ingebouwde afsprakenplanner, chatbot en lead-formulieren. Mobiel geoptimaliseerd en SEO-klaar.':
        'Des sites rapides et modernes avec planificateur de rendez-vous, chatbot et formulaires intégrés. Optimisés mobile et prêts pour le SEO.',
      'Ontdek websites': 'Découvrir les sites web',
      'Automatisaties': 'Automatisations',
      'Lead-opvolging, reviewaanvragen, herinneringen, no-show preventie — alles draait op de achtergrond zonder dat jij erbij hoeft.':
        "Suivi des leads, demandes d'avis, rappels, prévention des absences — tout tourne en arrière-plan sans votre intervention.",
      'Ontdek automatisaties': 'Découvrir les automatisations',
      'Sociale media': 'Réseaux sociaux',
      'Content planning, posten en analytics — gestructureerd, consistent en strategisch op je doelgroep gericht.':
        'Planification de contenu, publication et analyses — structuré, cohérent et stratégiquement ciblé sur votre audience.',
      'Ontdek social': 'Découvrir le social',
      'Wat onze klant zegt': 'Ce que dit notre client', 'Hoor het rechtstreeks': 'Écoutez-le directement',
      'van Sasha.': 'de Sasha.',
      'Een eerlijk interview met Sasha Kenis van Clinic3D — over wat we gebouwd hebben, hoe het werkt en wat het oplevert.':
        "Une interview honnête de Sasha Kenis de Clinic3D — sur ce que nous avons construit, comment ça marche et ce que ça rapporte.",
      'Interview': 'Interview',
      '227 afspraken in 104 dagen, geen enkele no-show, en mijn agenda zit': '227 rendez-vous en 104 jours, aucune absence, et mon agenda est',
      'voller dan ooit.': 'plus rempli que jamais.',
      'Mijn klanten boeken nu zelf — ik moet niets meer doen."': 'Mes clients réservent eux-mêmes — je n’ai plus rien à faire. »',
      'Eigenaar Clinic3D · Antwerpen': 'Propriétaire Clinic3D · Anvers',
      'Afspraken in 104 dagen': 'Rendez-vous en 104 jours', 'No-shows': 'Absences', 'Meer afspraken': 'Plus de rendez-vous',
      '48 Google reviews': '48 avis Google',
      'Wie staat erachter?': 'Qui est derrière ?', 'Lokaal. Persoonlijk.': 'Local. Personnel.', 'Toegankelijk.': 'Accessible.',
      'Belgisch bedrijf': 'Entreprise belge', 'BTW & support': 'TVA & support', 'Vast aanspreekpunt': 'Interlocuteur dédié',
      'Op maat gebouwd': 'Sur mesure', '100% jouw stijl': '100% votre style', 'Geen sjablonen': 'Aucun modèle',
      'Antwerpen · Limburg · Heel België': 'Anvers · Limbourg · Toute la Belgique',
      'Werkwijze': 'Méthode', 'Van eerste gesprek tot': 'Du premier échange à',
      'live binnen 14 dagen.': 'en ligne en 14 jours.',
      'Onze werkwijze is eenvoudig: jij vertelt ons wat je nodig hebt, wij bouwen het, jij gaat live. Geen technische rompslomp aan jouw kant.':
        "Notre méthode est simple : vous nous dites ce dont vous avez besoin, nous le construisons, vous passez en ligne. Aucune complexité technique de votre côté.",
      'Strategiegesprek': 'Entretien stratégique',
      '30 minuten waarin we jouw situatie, doelen en knelpunten in kaart brengen. Volledig gratis.':
        '30 minutes pour cartographier votre situation, vos objectifs et vos points bloquants. Entièrement gratuit.',
      'Plan op maat': 'Plan sur mesure',
      'We sturen een concreet voorstel met scope, planning en prijs. Geen verrassingen achteraf.':
        'Nous envoyons une proposition concrète avec périmètre, planning et prix. Aucune surprise.',
      'Bouw & test': 'Construction & test',
      'Wij bouwen alles. Jij krijgt tussentijds previews en kan feedback geven voor de lancering.':
        'Nous construisons tout. Vous recevez des aperçus et donnez votre avis avant le lancement.',
      'Live & doorlopend': 'En ligne & continu',
      'Binnen 14 dagen live. Wij monitoren, optimaliseren en blijven je vaste aanspreekpunt.':
        'En ligne en 14 jours. Nous surveillons, optimisons et restons votre interlocuteur dédié.',
      'Waarom EM Launchpad?': 'Pourquoi EM Launchpad ?', 'Wat je bij ons krijgt': 'Ce que vous obtenez chez nous',
      'en bij anderen niet.': 'et pas ailleurs.',
      'Wij zijn niet de goedkoopste. We zijn niet de grootste. Maar dit is wat ons anders maakt.':
        "Nous ne sommes ni les moins chers ni les plus grands. Mais voici ce qui nous distingue.",
      'Belgisch & lokaal': 'Belge & local',
      'Geen offshore support. Geen tijdzone-frustraties. Een vast aanspreekpunt in België dat je gewoon kunt bellen.':
        "Pas de support offshore. Pas de décalage horaire. Un interlocuteur dédié en Belgique que vous pouvez simplement appeler.",
      'Op maat, geen sjabloon': 'Sur mesure, pas de modèle',
      'Elk systeem wordt gebouwd voor jouw bedrijf, jouw klanten en jouw manier van werken. Geen kopie-plak werk.':
        "Chaque système est construit pour votre entreprise, vos clients et votre façon de travailler. Aucun copier-coller.",
      'Eén systeem, één login': 'Un système, un seul accès',
      'Geen losse tools die elkaar bestrijden. Website, AI, CRM en agenda werken samen in één geïntegreerd dashboard.':
        "Pas d'outils dispersés qui se combattent. Site, IA, CRM et agenda fonctionnent ensemble dans un tableau de bord intégré.",
      'Snel live': 'Rapidement en ligne',
      'Gemiddeld 14 dagen van briefing tot launch. Geen maandenlange trajecten, geen vertragingen.':
        'En moyenne 14 jours du briefing au lancement. Pas de projets interminables, pas de retards.',
      'Transparant in prijs': 'Prix transparent',
      'Je krijgt vooraf een duidelijke offerte. Geen verborgen kosten, geen onverwachte facturen achteraf.':
        "Vous recevez un devis clair à l'avance. Aucun frais caché, aucune facture inattendue.",
      'Doorlopend support': 'Support continu',
      'Wij verdwijnen niet na de lancering. Maandelijkse monitoring, optimalisatie en aanpassingen — voor zolang als nodig.':
        "Nous ne disparaissons pas après le lancement. Surveillance, optimisation et ajustements mensuels — aussi longtemps que nécessaire.",
      'Integraties': 'Intégrations', 'Werkt naadloos met': 'Fonctionne en parfaite harmonie avec',
      'jouw bestaande tools.': 'vos outils existants.',
      'We koppelen alles aan elkaar. Jouw agenda, CRM, communicatiekanalen, betalingssystemen — alles spreekt met elkaar.':
        'Nous connectons tout. Votre agenda, CRM, canaux de communication, systèmes de paiement — tout communique.',
      'Veelgestelde vragen': 'Questions fréquentes', 'Alles wat je wil weten': 'Tout ce que vous voulez savoir',
      'voor je beslist.': 'avant de décider.',
      'Wat kost een volledig systeem bij EM Launchpad?': 'Combien coûte un système complet chez EM Launchpad ?',
      'Elk project is op maat, dus de prijs hangt af van wat je nodig hebt — alleen een chatbot is anders dan een volledige stack met website, voice agent en automatisaties. Tijdens het gratis gesprek krijg je vooraf een duidelijke offerte. Geen verborgen kosten, geen verrassingen.':
        "Chaque projet est sur mesure, le prix dépend donc de vos besoins — un simple chatbot diffère d'une stack complète avec site, agent vocal et automatisations. Lors de l'appel gratuit, vous recevez un devis clair à l'avance. Aucun frais caché, aucune surprise.",
      'Hoe snel kan ik live?': 'En combien de temps puis-je être en ligne ?',
      'Gemiddeld 14 dagen van eerste gesprek tot livegang. Eenvoudige projecten kunnen sneller, complexere systemen duren iets langer. We geven je altijd een concrete planning in het voorstel.':
        "En moyenne 14 jours du premier échange à la mise en ligne. Les projets simples vont plus vite, les systèmes complexes prennent un peu plus de temps. Nous donnons toujours un planning concret dans la proposition.",
      'Moet ik technisch onderlegd zijn?': 'Dois-je avoir des compétences techniques ?',
      'Helemaal niet. Wij bouwen, configureren en onderhouden alles. Jij krijgt een eenvoudig dashboard waarin je alles ziet — maar je hoeft zelf niets in te stellen of bij te houden.':
        "Pas du tout. Nous construisons, configurons et maintenons tout. Vous obtenez un tableau de bord simple où vous voyez tout — sans rien configurer ni gérer vous-même.",
      'Wat als het niet voor mijn bedrijf werkt?': "Et si cela ne convient pas à mon entreprise ?",
      'In het gratis gesprek bepalen we samen of het past. Wij verkopen geen systemen die niet werken voor jouw situatie. Als het geen match is, zeggen we dat eerlijk.':
        "Lors de l'appel gratuit, nous déterminons ensemble si cela convient. Nous ne vendons pas de systèmes inadaptés à votre situation. Si ce n'est pas une bonne adéquation, nous le disons honnêtement.",
      'Zijn er maandelijkse kosten?': 'Y a-t-il des frais mensuels ?',
      'Ja, er is een transparant maandelijks bedrag voor het platform, hosting, monitoring en support. Dat krijg je vooraf zwart op wit, samen met de eenmalige kosten.':
        "Oui, il y a un montant mensuel transparent pour la plateforme, l'hébergement, la surveillance et le support. Vous le recevez par écrit à l'avance, avec les frais uniques.",
      'Kan ik jullie diensten ook los afnemen?': 'Puis-je commander vos services séparément ?',
      'Zeker. Wil je enkel een AI chatbot? Of alleen een website? Dat kan. Maar onze meeste klanten kiezen voor het volledige systeem omdat dat het meeste resultaat oplevert.':
        "Bien sûr. Vous voulez seulement un chatbot IA ? Ou juste un site web ? C'est possible. Mais la plupart de nos clients choisissent le système complet car il offre le meilleur résultat.",
      'Klaar om met de juiste': 'Prêt à grandir avec la bonne',
      'technologie te groeien?': 'technologie ?',
      'Plan een gratis kennismakingsgesprek van 30 minuten. We bekijken samen wat past bij jouw bedrijf — en wat je kunt verwachten als we ermee aan de slag gaan. Geen verplichtingen, geen sales-druk.':
        "Planifiez un appel découverte gratuit de 30 minutes. Nous regardons ensemble ce qui convient à votre entreprise — et ce que vous pouvez attendre. Sans engagement, sans pression commerciale.",
      'Plan je gratis gesprek': 'Planifiez votre appel gratuit',
      'Gratis en vrijblijvend': 'Gratuit et sans engagement', '30 minuten': '30 minutes', 'Direct duidelijkheid': 'Clarté immédiate',
      'einde pagina': 'fin de page', 'end_of_page': 'fin_de_page',

      /* loader */
      'systemen initialiseren': 'initialisation des systèmes', 'agenda koppelen': 'connexion de l’agenda',
      'ai laden': 'chargement de l’ia', 'klaar': 'prêt',
    },

    en: {
      /* nav + footer chrome */
      'home': 'home', 'diensten': 'services', 'blog': 'blog', 'over_ons': 'about',
      'contact': 'contact', 'live_demo': 'live_demo', 'gratis_demo': 'free_demo', 'plan_een_gesprek': 'book_a_call',
      'bedrijf': 'company', 'nieuwsbrief': 'newsletter', 'subscribe': 'subscribe',
      'all_systems_online // 24/7': 'all_systems_online // 24/7',
      'Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.':
        'Belgian AI agency from Limburg. We build websites, chatbots, voice agents and automations that help local businesses grow.',
      'ai chatbots': 'ai chatbots', 'ai voice agents': 'ai voice agents', 'websites': 'websites',
      'ai-automatisering': 'ai automation', 'reputatiebeheer': 'reputation management',
      'crm & dashboard': 'crm & dashboard', 'email & sms': 'email & sms',
      "funnels & landingspagina's": 'funnels & landing pages',
      'Brugstraat 2A, 3870 Vechmaal, België': 'Brugstraat 2A, 3870 Vechmaal, Belgium',
      '// lokaal_actief →': '// active_locally →', 'Heel Limburg & België': 'All of Limburg & Belgium',
      'GEMAAKT_IN_LIMBURG': 'MADE_IN_LIMBURG', 'BELGIË': 'BELGIUM',
      'jouw@email.be': 'your@email.com',

      /* ── HOME ── */
      'Gebouwd voor Belgische lokale bedrijven': 'Built for Belgian local businesses',
      '· Vertrouwd door Belgische ondernemers': '· Trusted by Belgian entrepreneurs',
      'De stille kracht achter': 'The quiet force behind',
      'groeiende Belgische bedrijven.': 'growing Belgian businesses.',
      'Wij bouwen websites, AI chatbots, voice agents en automatisaties die voor jou werken — terwijl jij focust op je vak. Eén systeem. Eén dashboard. Geen chaos.':
        'We build websites, AI chatbots, voice agents and automations that work for you — while you focus on your craft. One system. One dashboard. No chaos.',
      'Live binnen 14 dagen': 'Live within 14 days', '100% op maat': '100% custom-built',
      'Geen technische kennis nodig': 'No technical knowledge needed', 'Persoonlijk contact': 'Personal contact',
      'Plan een gratis gesprek': 'Book a free call', 'Bekijk onze cases': 'See our cases',
      'EM Launchpad AI': 'EM Launchpad AI', 'Online — antwoordt direct': 'Online — replies instantly',
      'Hallo! Waarvoor wil je een afspraak?': 'Hi! What would you like to book?',
      'Een knipbeurt komende week': 'A haircut next week',
      'Donderdag 14:30 vrij — past dat?': 'Thursday 2:30 PM is free — does that work?',
      'Afspraken · Vandaag': 'Appointments · Today', 'Automatisch': 'Automatically', 'ingepland': 'scheduled',
      'Nieuwe review': 'New review', '"Top service!"': '"Top service!"', '5 minuten geleden': '5 minutes ago',
      'Diensten': 'Services', 'Eén partner.': 'One partner.', 'Vijf systemen.': 'Five systems.',
      'Geen losse tools die elkaar tegenwerken. Geen drie verschillende leveranciers. Alles draait in één geïntegreerde omgeving die voor jou werkt.':
        'No scattered tools fighting each other. No three different vendors. Everything runs in one integrated environment that works for you.',
      'AI Chatbots': 'AI Chatbots',
      'Beantwoorden vragen, kwalificeren leads en boeken afspraken — op je website, WhatsApp, Instagram en Messenger.':
        'Answer questions, qualify leads and book appointments — on your website, WhatsApp, Instagram and Messenger.',
      'Ontdek chatbots': 'Explore chatbots',
      'AI Voice Agents': 'AI Voice Agents',
      'Mensachtige stem die elke oproep aanneemt, vragen beantwoordt en afspraken inplant — 24/7, in meerdere talen.':
        'A human-like voice that answers every call, responds to questions and schedules appointments — 24/7, in multiple languages.',
      'Ontdek voice agents': 'Explore voice agents',
      'Websites': 'Websites',
      'Snelle, moderne websites met ingebouwde afsprakenplanner, chatbot en lead-formulieren. Mobiel geoptimaliseerd en SEO-klaar.':
        'Fast, modern websites with a built-in scheduler, chatbot and lead forms. Mobile-optimized and SEO-ready.',
      'Ontdek websites': 'Explore websites',
      'Automatisaties': 'Automations',
      'Lead-opvolging, reviewaanvragen, herinneringen, no-show preventie — alles draait op de achtergrond zonder dat jij erbij hoeft.':
        'Lead follow-up, review requests, reminders, no-show prevention — it all runs in the background without you lifting a finger.',
      'Ontdek automatisaties': 'Explore automations',
      'Sociale media': 'Social media',
      'Content planning, posten en analytics — gestructureerd, consistent en strategisch op je doelgroep gericht.':
        'Content planning, posting and analytics — structured, consistent and strategically aimed at your audience.',
      'Ontdek social': 'Explore social',
      'Wat onze klant zegt': 'What our client says', 'Hoor het rechtstreeks': 'Hear it straight',
      'van Sasha.': 'from Sasha.',
      'Een eerlijk interview met Sasha Kenis van Clinic3D — over wat we gebouwd hebben, hoe het werkt en wat het oplevert.':
        'An honest interview with Sasha Kenis of Clinic3D — about what we built, how it works and what it delivers.',
      'Interview': 'Interview',
      '227 afspraken in 104 dagen, geen enkele no-show, en mijn agenda zit': '227 appointments in 104 days, not a single no-show, and my calendar is',
      'voller dan ooit.': 'fuller than ever.',
      'Mijn klanten boeken nu zelf — ik moet niets meer doen."': 'My clients now book themselves — I don\'t have to do a thing."',
      'Eigenaar Clinic3D · Antwerpen': 'Owner Clinic3D · Antwerp',
      'Afspraken in 104 dagen': 'Appointments in 104 days', 'No-shows': 'No-shows', 'Meer afspraken': 'More appointments',
      '48 Google reviews': '48 Google reviews',
      'Wie staat erachter?': 'Who\'s behind it?', 'Lokaal. Persoonlijk.': 'Local. Personal.', 'Toegankelijk.': 'Approachable.',
      'Belgisch bedrijf': 'Belgian company', 'BTW & support': 'VAT & support', 'Vast aanspreekpunt': 'Dedicated contact',
      'Op maat gebouwd': 'Custom-built', '100% jouw stijl': '100% your style', 'Geen sjablonen': 'No templates',
      'Antwerpen · Limburg · Heel België': 'Antwerp · Limburg · All of Belgium',
      'Werkwijze': 'How we work', 'Van eerste gesprek tot': 'From first call to',
      'live binnen 14 dagen.': 'live within 14 days.',
      'Onze werkwijze is eenvoudig: jij vertelt ons wat je nodig hebt, wij bouwen het, jij gaat live. Geen technische rompslomp aan jouw kant.':
        'Our approach is simple: you tell us what you need, we build it, you go live. No technical hassle on your end.',
      'Strategiegesprek': 'Strategy call',
      '30 minuten waarin we jouw situatie, doelen en knelpunten in kaart brengen. Volledig gratis.':
        '30 minutes to map out your situation, goals and pain points. Completely free.',
      'Plan op maat': 'Custom plan',
      'We sturen een concreet voorstel met scope, planning en prijs. Geen verrassingen achteraf.':
        'We send a concrete proposal with scope, timeline and price. No surprises afterwards.',
      'Bouw & test': 'Build & test',
      'Wij bouwen alles. Jij krijgt tussentijds previews en kan feedback geven voor de lancering.':
        'We build everything. You get previews along the way and can give feedback before launch.',
      'Live & doorlopend': 'Live & ongoing',
      'Binnen 14 dagen live. Wij monitoren, optimaliseren en blijven je vaste aanspreekpunt.':
        'Live within 14 days. We monitor, optimize and remain your dedicated contact.',
      'Waarom EM Launchpad?': 'Why EM Launchpad?', 'Wat je bij ons krijgt': 'What you get with us',
      'en bij anderen niet.': 'and not elsewhere.',
      'Wij zijn niet de goedkoopste. We zijn niet de grootste. Maar dit is wat ons anders maakt.':
        'We\'re not the cheapest. We\'re not the biggest. But here\'s what sets us apart.',
      'Belgisch & lokaal': 'Belgian & local',
      'Geen offshore support. Geen tijdzone-frustraties. Een vast aanspreekpunt in België dat je gewoon kunt bellen.':
        'No offshore support. No timezone frustration. A dedicated contact in Belgium you can simply call.',
      'Op maat, geen sjabloon': 'Custom, not a template',
      'Elk systeem wordt gebouwd voor jouw bedrijf, jouw klanten en jouw manier van werken. Geen kopie-plak werk.':
        'Every system is built for your business, your customers and your way of working. No copy-paste work.',
      'Eén systeem, één login': 'One system, one login',
      'Geen losse tools die elkaar bestrijden. Website, AI, CRM en agenda werken samen in één geïntegreerd dashboard.':
        'No scattered tools fighting each other. Website, AI, CRM and calendar work together in one integrated dashboard.',
      'Snel live': 'Fast to launch',
      'Gemiddeld 14 dagen van briefing tot launch. Geen maandenlange trajecten, geen vertragingen.':
        'On average 14 days from briefing to launch. No months-long projects, no delays.',
      'Transparant in prijs': 'Transparent pricing',
      'Je krijgt vooraf een duidelijke offerte. Geen verborgen kosten, geen onverwachte facturen achteraf.':
        'You get a clear quote upfront. No hidden costs, no unexpected invoices afterwards.',
      'Doorlopend support': 'Ongoing support',
      'Wij verdwijnen niet na de lancering. Maandelijkse monitoring, optimalisatie en aanpassingen — voor zolang als nodig.':
        'We don\'t vanish after launch. Monthly monitoring, optimization and adjustments — for as long as you need.',
      'Integraties': 'Integrations', 'Werkt naadloos met': 'Works seamlessly with',
      'jouw bestaande tools.': 'your existing tools.',
      'We koppelen alles aan elkaar. Jouw agenda, CRM, communicatiekanalen, betalingssystemen — alles spreekt met elkaar.':
        'We connect everything. Your calendar, CRM, communication channels, payment systems — it all talks to each other.',
      'Veelgestelde vragen': 'Frequently asked questions', 'Alles wat je wil weten': 'Everything you want to know',
      'voor je beslist.': 'before you decide.',
      'Wat kost een volledig systeem bij EM Launchpad?': 'What does a complete system cost at EM Launchpad?',
      'Elk project is op maat, dus de prijs hangt af van wat je nodig hebt — alleen een chatbot is anders dan een volledige stack met website, voice agent en automatisaties. Tijdens het gratis gesprek krijg je vooraf een duidelijke offerte. Geen verborgen kosten, geen verrassingen.':
        'Every project is custom, so the price depends on what you need — just a chatbot is different from a full stack with website, voice agent and automations. During the free call you get a clear quote upfront. No hidden costs, no surprises.',
      'Hoe snel kan ik live?': 'How fast can I go live?',
      'Gemiddeld 14 dagen van eerste gesprek tot livegang. Eenvoudige projecten kunnen sneller, complexere systemen duren iets langer. We geven je altijd een concrete planning in het voorstel.':
        'On average 14 days from first call to going live. Simple projects can be faster, complex systems take a bit longer. We always give a concrete timeline in the proposal.',
      'Moet ik technisch onderlegd zijn?': 'Do I need to be technical?',
      'Helemaal niet. Wij bouwen, configureren en onderhouden alles. Jij krijgt een eenvoudig dashboard waarin je alles ziet — maar je hoeft zelf niets in te stellen of bij te houden.':
        'Not at all. We build, configure and maintain everything. You get a simple dashboard where you see it all — but you don\'t have to set up or manage anything yourself.',
      'Wat als het niet voor mijn bedrijf werkt?': 'What if it doesn\'t work for my business?',
      'In het gratis gesprek bepalen we samen of het past. Wij verkopen geen systemen die niet werken voor jouw situatie. Als het geen match is, zeggen we dat eerlijk.':
        'In the free call we determine together whether it fits. We don\'t sell systems that won\'t work for your situation. If it\'s not a match, we say so honestly.',
      'Zijn er maandelijkse kosten?': 'Are there monthly costs?',
      'Ja, er is een transparant maandelijks bedrag voor het platform, hosting, monitoring en support. Dat krijg je vooraf zwart op wit, samen met de eenmalige kosten.':
        'Yes, there\'s a transparent monthly fee for the platform, hosting, monitoring and support. You get it in writing upfront, along with the one-time costs.',
      'Kan ik jullie diensten ook los afnemen?': 'Can I also order your services separately?',
      'Zeker. Wil je enkel een AI chatbot? Of alleen een website? Dat kan. Maar onze meeste klanten kiezen voor het volledige systeem omdat dat het meeste resultaat oplevert.':
        'Absolutely. Want just an AI chatbot? Or only a website? That\'s possible. But most of our clients choose the full system because it delivers the most results.',
      'Klaar om met de juiste': 'Ready to grow with the right',
      'technologie te groeien?': 'technology?',
      'Plan een gratis kennismakingsgesprek van 30 minuten. We bekijken samen wat past bij jouw bedrijf — en wat je kunt verwachten als we ermee aan de slag gaan. Geen verplichtingen, geen sales-druk.':
        'Book a free 30-minute intro call. We look together at what fits your business — and what to expect when we get started. No obligations, no sales pressure.',
      'Plan je gratis gesprek': 'Book your free call',
      'Gratis en vrijblijvend': 'Free and no obligation', '30 minuten': '30 minutes', 'Direct duidelijkheid': 'Immediate clarity',
      'einde pagina': 'end of page', 'end_of_page': 'end_of_page',

      /* loader */
      'systemen initialiseren': 'initializing systems', 'agenda koppelen': 'connecting calendar',
      'ai laden': 'loading ai', 'klaar': 'ready',
    },
  };

  // expose dict so per-page inline dictionaries can extend it before init
  window.EM_DICT = T;

  // ── ENGINE ───────────────────────────────────────────────────────────
  function getLang() { const l = localStorage.getItem(KEY); return LANGS.includes(l) ? l : 'nl'; }

  function collectTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const out = []; let n; while ((n = walker.nextNode())) out.push(n); return out;
  }

  function apply(lang) {
    const dict = T[lang] || {};
    collectTextNodes(document.body).forEach((n) => {
      if (n.__nl === undefined) n.__nl = n.nodeValue;       // remember original NL
      const orig = n.__nl;
      const key = orig.trim();
      if (lang === 'nl') { if (n.nodeValue !== orig) n.nodeValue = orig; return; }
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        const lead = orig.match(/^\s*/)[0], trail = orig.match(/\s*$/)[0];
        n.nodeValue = lead + dict[key] + trail;
      }
    });
    // translate placeholder + aria-label attributes
    document.querySelectorAll('[placeholder]').forEach((el) => {
      if (el.__nlPh === undefined) el.__nlPh = el.getAttribute('placeholder') || '';
      const k = el.__nlPh.trim();
      el.setAttribute('placeholder', lang === 'nl' ? el.__nlPh : (dict[k] || el.__nlPh));
    });
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
  }

  function updateSwitchUI(lang) {
    document.querySelectorAll('.lang-pick [data-setlang]').forEach((b) => {
      b.classList.toggle('active', b.dataset.setlang === lang);
    });
  }

  function setLang(lang) {
    if (!LANGS.includes(lang)) lang = 'nl';
    localStorage.setItem(KEY, lang);
    apply(lang); updateSwitchUI(lang);
  }

  function init() {
    // wire any .lang-pick switchers (nav injects one)
    document.querySelectorAll('.lang-pick').forEach((pick) => {
      if (pick.__wired) return; pick.__wired = true;
      pick.addEventListener('click', (e) => {
        const b = e.target.closest('[data-setlang]'); if (!b) return;
        setLang(b.dataset.setlang);
      });
    });
    const lang = getLang();
    apply(lang); updateSwitchUI(lang);
  }

  window.EMi18n = { init, setLang, getLang, apply };
})();

/* ---- i18n-pages.js (unchanged) ---- */
/* EMLaunchpad — i18n dictionary extension for the sub-pages
   (Diensten, Over ons, Contact, AI Chatbots, AI Voice Agents).
   Loaded AFTER i18n.js and BEFORE site.js so EM_DICT is complete before init.
   Brand names, e-mails, proper nouns and codes are intentionally left untranslated. */
(function () {
  const T = window.EM_DICT;
  if (!T) return;

  Object.assign(T.fr, {
    /* ── DIENSTEN ── */
    'Alles wat je nodig hebt om': 'Tout ce qu’il vous faut pour',
    'slimmer te groeien.': 'grandir plus intelligemment.',
    'Van AI-gesprekken tot betaalde campagnes en alles ertussen. Eén partner. Eén systeem. Geen losse tools die elkaar tegenwerken.':
      'Des conversations IA aux campagnes payantes et tout le reste. Un partenaire. Un système. Pas d’outils dispersés qui se contredisent.',
    'Kerndiensten': 'Services principaux', 'De fundamenten van': 'Les fondations d’',
    'een groeiend bedrijf.': 'une entreprise en croissance.', 'Elk met een eigen detailpagina.': 'Chacun avec sa propre page détaillée.',
    '24/7 vragen beantwoorden, leads kwalificeren en afspraken boeken.': '24/7 : répondre aux questions, qualifier les leads et prendre des rendez-vous.',
    'Live op je website, WhatsApp, Instagram en Messenger. Getraind op jouw bedrijf, jouw toon en jouw aanbod — geen generieke bot.':
      'En direct sur votre site, WhatsApp, Instagram et Messenger. Entraîné sur votre entreprise, votre ton et votre offre — pas un bot générique.',
    'Website, WhatsApp, Instagram & Messenger': 'Site web, WhatsApp, Instagram & Messenger',
    'Leadkwalificatie en CRM-sync': 'Qualification des leads et sync CRM',
    'Afspraken boeken in < 2 min': 'Rendez-vous en < 2 min', 'Aangepaste persoonlijkheid': 'Personnalité sur mesure',
    'Meer info': 'En savoir plus',
    'Een mensachtige stem die elke oproep aanneemt — dag en nacht.': 'Une voix humaine qui décroche chaque appel — jour et nuit.',
    'Klinkt natuurlijk, plant afspraken in je agenda en vangt leads op buiten je openingsuren. Werkt in meerdere talen.':
      'Sonne naturel, planifie des rendez-vous dans votre agenda et capte des leads hors horaires. Fonctionne en plusieurs langues.',
    '24/7 oproepen oppikken': 'Décroche les appels 24/7', 'Mensachtige stem & intonatie': 'Voix & intonation humaines',
    'Meertalig (NL/FR/EN/DE)': 'Multilingue (NL/FR/EN/DE)', 'Live CRM- en agenda-integratie': 'Intégration CRM & agenda en direct',
    'Premium websites die snel laden, sterk converteren en je merk positioneren.': 'Des sites premium rapides, qui convertissent fort et positionnent votre marque.',
    'Mobile-first, geoptimaliseerd voor Core Web Vitals, SEO-klaar en met ingebouwde afsprakenplanner en lead-formulieren.':
      'Mobile-first, optimisé pour les Core Web Vitals, prêt pour le SEO, avec planificateur de rendez-vous et formulaires intégrés.',
    'Mobile-first design': 'Design mobile-first', 'Snelle laadtijden (Core Web Vitals)': 'Chargement rapide (Core Web Vitals)',
    'SEO-klare structuur': 'Structure prête pour le SEO', 'Conversie-geoptimaliseerd': 'Optimisé pour la conversion',
    'AI-automatisering & workflows': 'Automatisation IA & workflows',
    'Slimme automatiseringen met n8n en moderne AI-tools die repetitief werk overnemen.':
      'Des automatisations intelligentes avec n8n et des outils IA modernes qui éliminent le travail répétitif.',
    'Lead routing, opvolging, herinneringen, reviewverzoeken en CRM-updates draaien automatisch op de achtergrond.':
      'Routage des leads, suivi, rappels, demandes d’avis et mises à jour CRM tournent automatiquement en arrière-plan.',
    'Lead routing & opvolging': 'Routage & suivi des leads', 'CRM-integraties': 'Intégrations CRM', 'Meerstapsautomatisering': 'Automatisation multi-étapes',
    'Aanvullende oplossingen': 'Solutions complémentaires', 'Extra modules wanneer': 'Des modules en plus quand',
    'jouw bedrijf eraan toe is.': 'votre entreprise est prête.', 'Klik op een dienst voor meer details.': 'Cliquez sur un service pour plus de détails.',
    'Reputatiebeheer · Google Reviews': 'E-réputation · Avis Google',
    'Automatisch reviews verzamelen na elke klant — bouw vertrouwen op autopilot.': 'Collectez des avis automatiquement après chaque client — bâtissez la confiance en pilote automatique.',
    '2 uur na elke afspraak vertrekt automatisch een reviewverzoek via SMS of e-mail. Tevreden klanten worden direct naar Google geleid, ontevreden klanten worden eerst privé afgevangen voor je merk.':
      'Deux heures après chaque rendez-vous, une demande d’avis part automatiquement par SMS ou e-mail. Les clients satisfaits sont dirigés vers Google, les mécontents sont d’abord gérés en privé pour protéger votre marque.',
    'Automatische SMS/e-mail na elke afspraak': 'SMS/e-mail automatique après chaque rendez-vous',
    'Negatief-filter beschermt je reputatie': 'Le filtre négatif protège votre réputation', 'Centraal review-dashboard': 'Tableau de bord d’avis centralisé',
    'CRM & Klantendashboard': 'CRM & tableau de bord client',
    'Eén dashboard waar alle communicatie samenkomt. Geen klant valt nog tussen de mazen.': 'Un tableau de bord où toute la communication se rejoint. Plus aucun client ne passe entre les mailles.',
    'WhatsApp, Instagram, e-mail, SMS, telefoongesprekken — alles in één unified inbox. Volledige klantgeschiedenis met notities, tags en pipeline-status op één scherm.':
      'WhatsApp, Instagram, e-mail, SMS, appels — tout dans une boîte de réception unifiée. Historique client complet avec notes, tags et statut de pipeline sur un seul écran.',
    'Unified inbox (alle kanalen)': 'Boîte de réception unifiée (tous canaux)', 'Tags, notities & pipelines': 'Tags, notes & pipelines',
    'Mobile app & team-toegang': 'App mobile & accès équipe', 'Email & SMS campagnes': 'Campagnes e-mail & SMS',
    'Nieuwsbrieven, promo-acties en seizoensaanbiedingen naar je hele database.': 'Newsletters, promotions et offres saisonnières vers toute votre base de données.',
    'Segmenteer klanten per type en stuur gerichte campagnes via e-mail of SMS. Drip-sequences starten automatisch op basis van gedrag, met volledige open- en click-tracking.':
      'Segmentez les clients par type et envoyez des campagnes ciblées par e-mail ou SMS. Les séquences drip démarrent automatiquement selon le comportement, avec suivi complet des ouvertures et clics.',
    'Klantsegmentatie & drip-sequences': 'Segmentation client & séquences drip', 'A/B testing & analytics': 'A/B testing & analyses',
    'High-converting pagina\'s voor Google Ads, Meta Ads of promocampagnes.': 'Des pages à forte conversion pour Google Ads, Meta Ads ou campagnes promo.',
    'Eén focus per pagina — één duidelijke conversie. Mobile-first ontworpen voor maximale snelheid, met geïntegreerde formulieren die direct naar je CRM gaan.':
      'Un seul focus par page — une conversion claire. Conçues mobile-first pour une vitesse maximale, avec formulaires intégrés directement reliés à votre CRM.',
    'Eén doel per pagina, supersnel': 'Un objectif par page, ultra-rapide', 'Directe CRM-integratie': 'Intégration CRM directe',
    'A/B testing & pixel tracking': 'A/B testing & suivi pixel', 'Online betalingen & facturatie': 'Paiements en ligne & facturation',
    'Stripe-integratie voor terugkerende betalingen, automatische facturen en herinneringen.': 'Intégration Stripe pour paiements récurrents, factures automatiques et rappels.',
    'Eénmalige betalingen, abonnementen of pay-per-use — alles via Stripe. Direct na betaling vertrekt automatisch een factuur, en onbetaalde facturen krijgen automatische herinneringen.':
      'Paiements uniques, abonnements ou pay-per-use — tout via Stripe. Une facture part automatiquement après paiement, et les factures impayées reçoivent des rappels automatiques.',
    'Subscriptions & eenmalige betalingen': 'Abonnements & paiements uniques', 'Klantportaal voor zelf raadplegen': 'Portail client en libre accès',
    'Hoe we werken': 'Comment nous travaillons', 'Van strategie tot live,': 'De la stratégie à la mise en ligne,', 'zonder ruis.': 'sans bruit.',
    'Strategie': 'Stratégie', 'We starten met een helder gesprek over doelen, doelgroep, positionering en opportuniteiten.': 'Nous commençons par un échange clair sur les objectifs, l’audience, le positionnement et les opportunités.',
    'Design': 'Design', 'We vertalen de strategie naar een strakke visuele richting en converterende gebruikersflow.': 'Nous traduisons la stratégie en une direction visuelle nette et un parcours utilisateur qui convertit.',
    'Bouw': 'Construction', 'Daarna ontwikkelen we alles performant, schaalbaar en technisch netjes afgewerkt.': 'Ensuite nous développons le tout : performant, évolutif et techniquement soigné.',
    'Lancering & optimalisatie': 'Lancement & optimisation', 'Na livegang blijven we meten, verfijnen en ondersteunen waar nodig.': 'Après la mise en ligne, nous mesurons, affinons et accompagnons selon les besoins.',
    'Niet zeker welke diensten': 'Pas sûr des services dont', 'jij nodig hebt?': 'vous avez besoin ?',
    'Boek een gratis gesprek van 30 minuten. We bekijken samen waar jouw bedrijf staat en welke combinatie het meeste impact heeft. Geen verplichtingen.':
      'Réservez un appel gratuit de 30 minutes. Nous regardons ensemble où en est votre entreprise et quelle combinaison a le plus d’impact. Sans engagement.',
    'Plan een gesprek': 'Planifier un appel',

    /* ── OVER ONS ── */
    'Over ons': 'À propos', 'Wij bouwen systemen die': 'Nous bâtissons des systèmes qui', 'klanten opleveren.': 'rapportent des clients.',
    'De meeste bedrijven hebben een website, maar geen systeem dat echt werkt.': 'La plupart des entreprises ont un site web, mais pas de système qui fonctionne vraiment.',
    'Automatisatie': 'Automatisation', 'Systemen': 'Systèmes', 'Neem contact op': 'Contactez-nous',
    'Waarom wij bestaan': 'Pourquoi nous existons', 'De meeste bedrijven hebben tools.': 'La plupart des entreprises ont des outils.',
    'Maar geen systeem dat echt werkt.': 'Mais pas de système qui fonctionne vraiment.',
    'Geen structuur': 'Aucune structure', 'Bezoekers komen binnen, maar weten niet wat ze moeten doen.': 'Les visiteurs arrivent, mais ne savent pas quoi faire.',
    'Geen opvolging': 'Aucun suivi', 'Leads verdwijnen omdat er geen systeem achter zit.': 'Les leads disparaissent faute de système derrière.',
    'Losse tools': 'Outils dispersés', 'Alles werkt apart en niets sluit op elkaar aan.': 'Tout fonctionne séparément et rien ne s’emboîte.',
    'Daardoor verliezen bedrijven elke dag klanten.': 'Résultat : les entreprises perdent des clients chaque jour.', 'Dat is exact wat wij oplossen.': 'C’est exactement ce que nous résolvons.',
    'Onze aanpak': 'Notre approche', 'Wij bouwen geen websites.': 'Nous ne construisons pas des sites web.', 'Wij bouwen systemen.': 'Nous bâtissons des systèmes.',
    'Alles wat we doen is gebouwd om klanten te genereren.': 'Tout ce que nous faisons est conçu pour générer des clients.',
    'Geen design-only': 'Pas que du design', 'Mooie websites zonder strategie leveren niets op.': 'Les beaux sites sans stratégie ne rapportent rien.',
    'Alles werkt samen': 'Tout fonctionne ensemble', 'Website, opvolging en systemen versterken elkaar.': 'Site, suivi et systèmes se renforcent mutuellement.',
    'Gebouwd voor groei': 'Conçu pour la croissance', 'Klaar om te schalen vanaf dag één.': 'Prêt à évoluer dès le premier jour.',
    'Waar wij voor staan': 'Nos valeurs', 'Drie principes,': 'Trois principes,', 'geen compromissen.': 'aucun compromis.',
    'Resultaat': 'Résultat', 'Alles wat we bouwen moet klanten opleveren.': 'Tout ce que nous bâtissons doit rapporter des clients.',
    'Snelheid': 'Rapidité', 'Binnen 14 dagen live en klaar om te groeien.': 'En ligne en 14 jours et prêt à grandir.',
    'Focus': 'Focus', 'Geen afleiding. Alleen wat werkt.': 'Aucune distraction. Uniquement ce qui marche.',
    'Het team': 'L’équipe', 'De mensen achter': 'Les personnes derrière', 'Wij bouwen systemen die bedrijven laten groeien.': 'Nous bâtissons des systèmes qui font grandir les entreprises.',
    'Strategie & Groei': 'Stratégie & Croissance', 'Focus op structuur, positioning en systemen die klanten genereren.': 'Focus sur la structure, le positionnement et les systèmes qui génèrent des clients.',
    'Automatisatie & Implementatie': 'Automatisation & Implémentation', 'Zorgt dat alles technisch werkt en perfect samenkomt.': 'Veille à ce que tout fonctionne techniquement et s’assemble parfaitement.',
    'Erkend en zichtbaar': 'Reconnu et visible', 'Opgepikt door media': 'Repéré par les médias', 'en bedrijven.': 'et les entreprises.',
    'EM Launchpad groeit snel en wordt opgepikt door media en bedrijven.': 'EM Launchpad grandit vite et est repéré par les médias et les entreprises.',
    'Projecten gebouwd': 'Projets réalisés', 'Gemiddelde groei': 'Croissance moyenne', 'Systemen actief': 'Systèmes actifs', 'Gemiddeld tot live': 'En moyenne jusqu’en ligne',
    'Resultaten die spreken': 'Des résultats qui parlent', 'Wat er gebeurt wanneer': 'Ce qui se passe quand', 'alles samenwerkt.': 'tout fonctionne ensemble.',
    'Nieuwe structuur en duidelijke flow zorgden voor meer aanvragen.': 'Une nouvelle structure et un parcours clair ont généré plus de demandes.',
    'aanvragen': 'demandes', 'conversie': 'conversion', 'Klaar om': 'Prêt à', 'te groeien?': 'grandir ?',
    'Laat ons kijken waar jouw grootste kansen liggen.': 'Laissez-nous voir où se trouvent vos plus grandes opportunités.',

    /* ── CONTACT ── */
    '7 dagen op 7 bereikbaar · antwoord binnen 4 uur': 'Joignables 7j/7 · réponse sous 4 h', 'Laten we': 'Et si on', 'praten.': 'discutait.',
    'Een vraag? Een project? Of gewoon even kennismaken? We zijn rechtstreeks bereikbaar — geen ticketsysteem, geen wachtrijen.':
      'Une question ? Un projet ? Ou simplement faire connaissance ? Nous sommes joignables directement — pas de système de tickets, pas de files d’attente.',
    'Telefoon': 'Téléphone', 'E-mail': 'E-mail', 'Locatie': 'Localisation', 'Limburg · België': 'Limbourg · Belgique', 'Actief in heel het land': 'Actifs dans tout le pays',
    'Ma — Vr': 'Lun — Ven', 'Za — Zo': 'Sam — Dim', 'Op afspraak': 'Sur rendez-vous', 'Beschikbaar': 'Disponible', '7 dagen op 7': '7j/7',
    'Stuur ons een bericht': 'Envoyez-nous un message',
    'Vul het formulier in en we nemen binnen 24 uur contact op met een concreet voorstel of een gratis gesprek.':
      'Remplissez le formulaire et nous vous recontactons sous 24 h avec une proposition concrète ou un appel gratuit.',
    'Naam': 'Nom', 'Bericht': 'Message', 'Verstuur bericht': 'Envoyer le message', 'Formulier laadt niet? Mail ons direct op': 'Le formulaire ne charge pas ? Écrivez-nous directement à',
    'Liever een andere weg?': 'Vous préférez une autre voie ?', 'Kies wat voor': 'Choisissez ce qui', 'jou werkt.': 'vous convient.', 'We zijn op elk kanaal even snel.': 'Nous sommes aussi rapides sur chaque canal.',
    'Bel ons direct': 'Appelez-nous directement', 'Snelste manier om antwoord te krijgen. We nemen zelf op.': 'Le moyen le plus rapide d’avoir une réponse. Nous décrochons nous-mêmes.', 'Bel nu': 'Appeler',
    '30 minuten online of telefoon. Kies zelf je moment in onze agenda.': '30 minutes en ligne ou par téléphone. Choisissez votre créneau dans notre agenda.', 'Open agenda': 'Ouvrir l’agenda',
    'Stuur een berichtje en we antwoorden binnen het uur (tijdens werkdagen).': 'Envoyez un message et nous répondons dans l’heure (en semaine).', 'Open chat': 'Ouvrir le chat',
    'Hoe snel krijg ik antwoord?': 'En combien de temps ai-je une réponse ?',
    '7 dagen op 7 binnen 4 uur op formulieren en e-mails. Telefoon en WhatsApp gaan meestal sneller — binnen het uur. Ook in het weekend.':
      '7j/7 sous 4 h pour les formulaires et e-mails. Téléphone et WhatsApp sont souvent plus rapides — dans l’heure. Le week-end aussi.',
    'Krijg ik direct een offerte?': 'Ai-je un devis tout de suite ?',
    'Nee — eerst plannen we een kort gesprek om je situatie en doelen te begrijpen. Pas dan kunnen we een realistisch voorstel maken dat écht bij jouw bedrijf past. Geen pre-fab offertes met cijfers uit de lucht.':
      'Non — nous planifions d’abord un court échange pour comprendre votre situation et vos objectifs. C’est seulement alors que nous faisons une proposition réaliste, vraiment adaptée à votre entreprise. Pas de devis pré-fabriqués avec des chiffres sortis de nulle part.',
    'Kunnen we ergens fysiek afspreken?': 'Peut-on se rencontrer physiquement ?',
    'Zeker. We komen graag bij jou ter plaatse in heel België — of jij komt naar Antwerpen of Limburg. De meeste klanten kiezen voor een eerste online gesprek (sneller en efficiënter), maar het mag perfect fysiek.':
      'Bien sûr. Nous venons volontiers chez vous partout en Belgique — ou vous venez à Anvers ou au Limbourg. La plupart des clients choisissent un premier échange en ligne (plus rapide et efficace), mais le présentiel est tout à fait possible.',
    'Werken jullie ook met startups?': 'Travaillez-vous aussi avec des startups ?',
    'Ja, we hebben verschillende pakketten — van een eerste website voor een startend bedrijf tot complete AI-stack voor groeiende KMO\'s. We bekijken samen wat realistisch is binnen jouw budget.':
      'Oui, nous avons différentes formules — d’un premier site pour une jeune entreprise à une stack IA complète pour les PME en croissance. Nous regardons ensemble ce qui est réaliste dans votre budget.',
    'Geen tijd om te wachten?': 'Pas le temps d’attendre ?', 'Plan direct een gesprek.': 'Planifiez un appel tout de suite.',
    'Kies zelf een moment in onze agenda — vandaag nog mogelijk. 30 minuten, geen verplichtingen.': 'Choisissez un créneau dans notre agenda — possible dès aujourd’hui. 30 minutes, sans engagement.',

    /* ── AI CHATBOTS ── */
    'Een AI-assistent die': 'Un assistant IA qui', 'nooit slaapt.': 'ne dort jamais.',
    'Beantwoordt vragen, kwalificeert leads en boekt afspraken — op je website, WhatsApp, Instagram en Messenger. Getraind op jóuw bedrijf, jouw toon en jouw aanbod.':
      'Répond aux questions, qualifie les leads et prend des rendez-vous — sur votre site, WhatsApp, Instagram et Messenger. Entraîné sur VOTRE entreprise, votre ton et votre offre.',
    '24/7 bereikbaar': 'Joignable 24/7', 'Antwoord in < 2 sec': 'Réponse en < 2 s', 'Boekt afspraken': 'Prend des rendez-vous',
    'Bekijk live demo': 'Voir la démo live', 'Ik automatiseer uw workflows': 'J’automatise vos workflows', 'Afspraak ingepland ✓': 'Rendez-vous planifié ✓', 'Chat met mij': 'Discutez avec moi',
    'Overal aanwezig': 'Présent partout', 'Eén bot.': 'Un seul bot.', 'Al je kanalen.': 'Tous vos canaux.',
    'Je klanten kiezen waar ze praten — je chatbot is overal, met dezelfde kennis en dezelfde toon.': 'Vos clients choisissent où parler — votre chatbot est partout, avec le même savoir et le même ton.',
    'Een chat-widget die bezoekers direct helpt en omzet in leads.': 'Un widget de chat qui aide les visiteurs aussitôt et les convertit en leads.',
    'Beantwoord vragen waar je klanten al chatten — automatisch.': 'Répondez aux questions là où vos clients discutent déjà — automatiquement.',
    'DM\'s en story-reacties worden automatisch opgevolgd.': 'Les DM et réactions aux stories sont suivis automatiquement.',
    'Facebook-berichten worden direct en persoonlijk beantwoord.': 'Les messages Facebook reçoivent une réponse immédiate et personnelle.',
    'Wat het doet': 'Ce qu’il fait', 'Meer dan vragen beantwoorden.': 'Bien plus que répondre aux questions.', 'Het laat je groeien.': 'Il vous fait grandir.',
    'Vragen beantwoorden': 'Répondre aux questions', 'Openingsuren, prijzen, beschikbaarheid, diensten — direct en correct, dag en nacht.': 'Horaires, prix, disponibilités, services — aussitôt et correctement, jour et nuit.',
    'Stelt de juiste vragen, herkent koopintentie en stuurt warme leads naar je CRM.': 'Pose les bonnes questions, repère l’intention d’achat et envoie les leads chauds vers votre CRM.',
    'Afspraken boeken': 'Prendre des rendez-vous', 'Toont vrije momenten en plant rechtstreeks in je agenda — in minder dan 2 minuten.': 'Affiche les créneaux libres et réserve directement dans votre agenda — en moins de 2 minutes.',
    'Doorschakelen naar een mens': 'Transférer à un humain', 'Complexe vraag? De bot draagt het gesprek naadloos over aan jou of je team.': 'Question complexe ? Le bot transfère la conversation en douceur vers vous ou votre équipe.',
    'Antwoordt automatisch in NL, FR, EN of DE — in de taal van je klant.': 'Répond automatiquement en NL, FR, EN ou DE — dans la langue de votre client.',
    'Getraind op jouw bedrijf': 'Entraîné sur votre entreprise', 'Geen generieke bot. Geladen met jouw diensten, toon en veelgestelde vragen.': 'Pas un bot générique. Chargé de vos services, votre ton et vos questions fréquentes.',
    'Live demo': 'Démo live', 'Zo voelt een gesprek': 'Voici à quoi ressemble une conversation', 'met je bot.': 'avec votre bot.',
    'Natuurlijk, snel en altijd on-brand. De bot begrijpt context, stelt vervolgvragen en sluit af met een concrete actie — een geboekte afspraak of een gekwalificeerde lead.':
      'Naturel, rapide et toujours fidèle à votre marque. Le bot comprend le contexte, pose des questions de suivi et termine par une action concrète — un rendez-vous réservé ou un lead qualifié.',
    'Begrijpt natuurlijke taal, geen keuzemenu\'s': 'Comprend le langage naturel, pas de menus', 'Onthoudt context binnen het gesprek': 'Retient le contexte dans la conversation',
    'Eindigt altijd met een duidelijke actie': 'Se termine toujours par une action claire', 'Ik wil dit voor mijn bedrijf': 'Je veux ça pour mon entreprise',
    'Typ een bericht…': 'Tapez un message…', 'Hoe het werkt': 'Comment ça marche', 'Van briefing tot': 'Du briefing à', 'live binnen dagen.': 'en ligne en quelques jours.',
    'Intake & training': 'Intake & entraînement', 'Kanalen koppelen': 'Connexion des canaux', 'Testen & finetunen': 'Tests & réglages', 'Live & optimaliseren': 'En ligne & optimisation',
    'We voeden de bot met je diensten, prijzen, FAQ en toon — zodat hij klinkt als jouw bedrijf, niet als een generieke assistent.':
      'Nous nourrissons le bot de vos services, prix, FAQ et ton — pour qu’il sonne comme votre entreprise, pas comme un assistant générique.',
    'Website, WhatsApp, Instagram en Messenger worden aangesloten op één centraal brein met dezelfde kennis en toon.':
      'Site, WhatsApp, Instagram et Messenger sont reliés à un cerveau central unique avec le même savoir et le même ton.',
    'We spelen echte scenario\'s na en verfijnen de antwoorden tot elk gesprek natuurlijk en correct verloopt.':
      'Nous rejouons de vrais scénarios et affinons les réponses jusqu’à ce que chaque conversation soit naturelle et correcte.',
    'De bot gaat live en wordt maandelijks bijgestuurd op basis van echte gesprekken en nieuwe vragen.':
      'Le bot passe en ligne et est ajusté chaque mois selon les vraies conversations et les nouvelles questions.',
    'Klinkt de bot niet robotachtig?': 'Le bot ne sonne-t-il pas robotique ?',
    'Nee. We trainen de bot op jouw toon en schrijfstijl. Hij begrijpt natuurlijke taal — geen starre keuzemenu\'s — en de meeste klanten merken niet eens dat ze met AI praten.':
      'Non. Nous entraînons le bot sur votre ton et votre style. Il comprend le langage naturel — pas de menus rigides — et la plupart des clients ne réalisent même pas qu’ils parlent à une IA.',
    'Wat als de bot iets niet weet?': 'Et si le bot ne sait pas quelque chose ?',
    'Dan draagt hij het gesprek naadloos over aan jou of je team, of plant een terugbelmoment in. Hij verzint nooit antwoorden — eerlijkheid boven alles.':
      'Alors il transfère la conversation en douceur vers vous ou votre équipe, ou planifie un rappel. Il n’invente jamais de réponses — l’honnêteté avant tout.',
    'Op welke kanalen werkt het?': 'Sur quels canaux ça fonctionne ?',
    'Website, WhatsApp, Instagram en Facebook Messenger — allemaal aangestuurd door hetzelfde brein, met dezelfde kennis en toon op elk kanaal.':
      'Site, WhatsApp, Instagram et Facebook Messenger — tous pilotés par le même cerveau, avec le même savoir et le même ton sur chaque canal.',
    'Hoe snel kan de bot live?': 'En combien de temps le bot est-il en ligne ?',
    'Een chatbot staat doorgaans binnen enkele dagen live. Na intake en training testen we grondig en gaan we online — meestal binnen 14 dagen, vaak sneller.':
      'Un chatbot est généralement en ligne en quelques jours. Après l’intake et l’entraînement, nous testons en profondeur puis mettons en ligne — souvent en moins de 14 jours.',
    'Klaar voor een assistent die': 'Prêt pour un assistant qui', 'nooit een lead mist?': 'ne manque jamais un lead ?',
    'Plan een gratis gesprek van 30 minuten. We bouwen je bot op maat en zetten hem live op al je kanalen.':
      'Réservez un appel gratuit de 30 minutes. Nous créons votre bot sur mesure et le mettons en ligne sur tous vos canaux.',

    /* ── AI VOICE AGENTS ── */
    'Een stem die': 'Une voix qui', 'elke oproep aanneemt.': 'décroche chaque appel.',
    'Een mensachtige AI-receptionist die 24/7 opneemt, vragen beantwoordt en afspraken inplant — in meerdere talen. Geen gemiste oproepen, geen voicemail, geen wachtmuziek.':
      'Un réceptionniste IA à voix humaine qui décroche 24/7, répond aux questions et planifie des rendez-vous — en plusieurs langues. Aucun appel manqué, aucune messagerie, aucune musique d’attente.',
    'Neemt op in 1 ring': 'Décroche en 1 sonnerie', 'Klinkt menselijk': 'Sonne humain', 'Boekt in je agenda': 'Réserve dans votre agenda', 'Probeer de demo': 'Essayez la démo',
    'EM Voice Agent': 'EM Voice Agent', 'Inkomende oproep · +32 …': 'Appel entrant · +32 …', 'Stand-by': 'En veille', 'Beantwoord de oproep': 'Répondre à l’appel',
    'Druk op': 'Appuyez sur', 'Beantwoord': 'Répondre', 'om een live gesprek te horen meelopen.': 'pour suivre une conversation en direct.',
    'van de oproepen beantwoord': 'des appels pris', 'ring tot opnemen': 'sonnerie avant décroché', 'ook \'s nachts & weekend': 'aussi la nuit & le week-end', 'talen vloeiend': 'langues couramment',
    'Wat hij voor je doet': 'Ce qu’il fait pour vous', 'Eén stem,': 'Une voix,', 'elke situatie.': 'chaque situation.', 'Kies een scenario en zie hoe de voice agent het afhandelt.': 'Choisissez un scénario et voyez comment l’agent vocal le gère.',
    'Afspraken inplannen': 'Planifier des rendez-vous', 'Boekt rechtstreeks in je agenda': 'Réserve directement dans votre agenda', 'Uren, prijzen, route, diensten': 'Horaires, prix, itinéraire, services',
    'Filtert en noteert de juiste info': 'Filtre et note les bonnes infos', 'Doorverbinden': 'Transférer', 'Schakelt door naar jou of je team': 'Transfère vers vous ou votre équipe',
    'Boekt afspraken terwijl jij werkt.': 'Réserve des rendez-vous pendant que vous travaillez.',
    'De agent checkt je live beschikbaarheid, stelt passende tijdslots voor en bevestigt de afspraak in je agenda — met een automatische bevestiging via SMS of e-mail.':
      'L’agent vérifie vos disponibilités en direct, propose des créneaux adaptés et confirme le rendez-vous dans votre agenda — avec une confirmation automatique par SMS ou e-mail.',
    'Live agenda-synchronisatie': 'Synchronisation d’agenda en direct', 'Automatische bevestiging & herinnering': 'Confirmation & rappel automatiques', 'Voorkomt dubbele boekingen': 'Évite les doubles réservations',
    'Beantwoordt elke vraag, direct.': 'Répond à chaque question, aussitôt.',
    'Openingsuren, prijzen, beschikbaarheid, bereikbaarheid — de agent kent je bedrijf en geeft altijd het juiste antwoord, zonder de beller te laten wachten.':
      'Horaires, prix, disponibilités, accessibilité — l’agent connaît votre entreprise et donne toujours la bonne réponse, sans faire attendre l’appelant.',
    'Getraind op jouw bedrijfsinfo': 'Entraîné sur les infos de votre entreprise', 'Nooit "ik weet het niet"': 'Jamais de « je ne sais pas »', 'Consistent in elke taal': 'Cohérent dans chaque langue',
    'Kwalificeert leads aan de telefoon.': 'Qualifie les leads au téléphone.',
    'Stelt de juiste vervolgvragen, noteert budget en behoefte, en stuurt een volledig samengevatte lead naar je CRM — klaar voor opvolging.':
      'Pose les bonnes questions de suivi, note le budget et le besoin, et envoie un lead entièrement résumé vers votre CRM — prêt pour le suivi.',
    'Herkent koopintentie': 'Repère l’intention d’achat', 'Volledige samenvatting in je CRM': 'Résumé complet dans votre CRM', 'Prioriteert warme leads': 'Priorise les leads chauds',
    'Verbindt door wanneer het moet.': 'Transfère quand il le faut.',
    'Dringende of complexe oproep? De agent schakelt naadloos door naar jou of de juiste collega — of plant een terugbelmoment als er niemand vrij is.':
      'Appel urgent ou complexe ? L’agent transfère en douceur vers vous ou le bon collègue — ou planifie un rappel si personne n’est disponible.',
    'Slimme doorschakelregels': 'Règles de transfert intelligentes', 'Terugbelafspraak bij geen gehoor': 'Rappel planifié si pas de réponse', 'Niets gaat verloren': 'Rien ne se perd',
    'Waarom het werkt': 'Pourquoi ça marche', 'Werkt als een machine.': 'Travaille comme une machine.',
    'Natuurlijke stem': 'Voix naturelle', 'Echte intonatie en pauzes — bellers merken nauwelijks dat het AI is.': 'Vraie intonation et pauses — les appelants remarquent à peine que c’est une IA.',
    'Neemt altijd op': 'Décroche toujours', 'Geen wachtrij, geen voicemail. Elke beller krijgt meteen antwoord.': 'Pas de file d’attente, pas de messagerie. Chaque appelant a une réponse immédiate.',
    'Schakelt automatisch tussen NL, FR, EN en DE op basis van de beller.': 'Bascule automatiquement entre NL, FR, EN et DE selon l’appelant.',
    'Live synchronisatie met je kalender — geen dubbele boekingen.': 'Synchronisation en direct avec votre calendrier — aucune double réservation.',
    'Privacy & GDPR': 'Confidentialité & RGPD', 'Gesprekken worden veilig en conform de wetgeving verwerkt.': 'Les conversations sont traitées en sécurité et conformément à la loi.',
    'Live transcripties': 'Transcriptions en direct', 'Elke oproep wordt automatisch uitgeschreven en opgeslagen in je CRM.': 'Chaque appel est automatiquement transcrit et enregistré dans votre CRM.',
    'Horen bellers dat het AI is?': 'Les appelants entendent-ils que c’est une IA ?',
    'Zelden. De stem heeft natuurlijke intonatie en pauzes. We kunnen de agent zich ook gewoon als digitale assistent laten voorstellen — jij kiest hoe transparant het is.':
      'Rarement. La voix a une intonation et des pauses naturelles. L’agent peut aussi se présenter comme assistant numérique — vous choisissez le degré de transparence.',
    'Werkt het op mijn bestaande nummer?': 'Ça fonctionne sur mon numéro existant ?',
    'Ja. We koppelen de agent aan je huidige nummer of zetten een doorschakeling op. Je hoeft niets te veranderen aan je telefoonabonnement.':
      'Oui. Nous relions l’agent à votre numéro actuel ou mettons en place un transfert. Vous n’avez rien à changer à votre abonnement téléphonique.',
    'Wat als de agent het antwoord niet weet?': 'Et si l’agent ne connaît pas la réponse ?',
    'Dan verbindt hij door naar jou of een collega, of plant een terugbelmoment in. Hij verzint nooit antwoorden — bij twijfel schakelt hij naar een mens.':
      'Alors il transfère vers vous ou un collègue, ou planifie un rappel. Il n’invente jamais de réponses — en cas de doute, il passe à un humain.',
    'Hoeveel oproepen kan hij tegelijk aan?': 'Combien d’appels peut-il gérer en même temps ?',
    'Onbeperkt. Of er nu één of vijftig mensen tegelijk bellen — iedereen krijgt meteen antwoord. Geen wachtrij, geen gemiste oproepen tijdens piekmomenten.':
      'Illimité. Qu’une ou cinquante personnes appellent en même temps — chacun a une réponse immédiate. Pas de file d’attente, aucun appel manqué en période de pointe.',
    'Laat geen enkele oproep': 'Ne laissez plus aucun appel', 'nog onbeantwoord.': 'sans réponse.',
    'Plan een gratis gesprek van 30 minuten. We zetten je voice agent op maat op en koppelen hem aan je nummer en agenda.':
      'Réservez un appel gratuit de 30 minutes. Nous configurons votre agent vocal sur mesure et le relions à votre numéro et votre agenda.',

    /* shared sub-page bits */
    'Goed om': 'Bon à', 'te weten.': 'savoir.', 'Meertalig': 'Multilingue',
    "Funnels & landingspagina's": "Tunnels & pages d'atterrissage",
  });

  Object.assign(T.en, {
    /* ── DIENSTEN ── */
    'Alles wat je nodig hebt om': 'Everything you need to',
    'slimmer te groeien.': 'grow smarter.',
    'Van AI-gesprekken tot betaalde campagnes en alles ertussen. Eén partner. Eén systeem. Geen losse tools die elkaar tegenwerken.':
      'From AI conversations to paid campaigns and everything in between. One partner. One system. No scattered tools fighting each other.',
    'Kerndiensten': 'Core services', 'De fundamenten van': 'The foundations of',
    'een groeiend bedrijf.': 'a growing business.', 'Elk met een eigen detailpagina.': 'Each with its own detail page.',
    '24/7 vragen beantwoorden, leads kwalificeren en afspraken boeken.': '24/7 answering questions, qualifying leads and booking appointments.',
    'Live op je website, WhatsApp, Instagram en Messenger. Getraind op jouw bedrijf, jouw toon en jouw aanbod — geen generieke bot.':
      'Live on your website, WhatsApp, Instagram and Messenger. Trained on your business, your tone and your offering — not a generic bot.',
    'Website, WhatsApp, Instagram & Messenger': 'Website, WhatsApp, Instagram & Messenger',
    'Leadkwalificatie en CRM-sync': 'Lead qualification and CRM sync',
    'Afspraken boeken in < 2 min': 'Book appointments in < 2 min', 'Aangepaste persoonlijkheid': 'Custom personality',
    'Meer info': 'Learn more',
    'Een mensachtige stem die elke oproep aanneemt — dag en nacht.': 'A human-like voice that answers every call — day and night.',
    'Klinkt natuurlijk, plant afspraken in je agenda en vangt leads op buiten je openingsuren. Werkt in meerdere talen.':
      'Sounds natural, books appointments in your calendar and catches leads outside your opening hours. Works in multiple languages.',
    '24/7 oproepen oppikken': 'Answers calls 24/7', 'Mensachtige stem & intonatie': 'Human-like voice & intonation',
    'Meertalig (NL/FR/EN/DE)': 'Multilingual (NL/FR/EN/DE)', 'Live CRM- en agenda-integratie': 'Live CRM & calendar integration',
    'Premium websites die snel laden, sterk converteren en je merk positioneren.': 'Premium websites that load fast, convert strongly and position your brand.',
    'Mobile-first, geoptimaliseerd voor Core Web Vitals, SEO-klaar en met ingebouwde afsprakenplanner en lead-formulieren.':
      'Mobile-first, optimized for Core Web Vitals, SEO-ready and with a built-in scheduler and lead forms.',
    'Mobile-first design': 'Mobile-first design', 'Snelle laadtijden (Core Web Vitals)': 'Fast load times (Core Web Vitals)',
    'SEO-klare structuur': 'SEO-ready structure', 'Conversie-geoptimaliseerd': 'Conversion-optimized',
    'AI-automatisering & workflows': 'AI automation & workflows',
    'Slimme automatiseringen met n8n en moderne AI-tools die repetitief werk overnemen.':
      'Smart automations with n8n and modern AI tools that take over repetitive work.',
    'Lead routing, opvolging, herinneringen, reviewverzoeken en CRM-updates draaien automatisch op de achtergrond.':
      'Lead routing, follow-up, reminders, review requests and CRM updates run automatically in the background.',
    'Lead routing & opvolging': 'Lead routing & follow-up', 'CRM-integraties': 'CRM integrations', 'Meerstapsautomatisering': 'Multi-step automation',
    'Aanvullende oplossingen': 'Additional solutions', 'Extra modules wanneer': 'Extra modules when',
    'jouw bedrijf eraan toe is.': 'your business is ready.', 'Klik op een dienst voor meer details.': 'Click a service for more details.',
    'Reputatiebeheer · Google Reviews': 'Reputation management · Google Reviews',
    'Automatisch reviews verzamelen na elke klant — bouw vertrouwen op autopilot.': 'Automatically collect reviews after every customer — build trust on autopilot.',
    '2 uur na elke afspraak vertrekt automatisch een reviewverzoek via SMS of e-mail. Tevreden klanten worden direct naar Google geleid, ontevreden klanten worden eerst privé afgevangen voor je merk.':
      'Two hours after every appointment, a review request goes out automatically via SMS or email. Happy customers are sent straight to Google, unhappy ones are caught privately first to protect your brand.',
    'Automatische SMS/e-mail na elke afspraak': 'Automatic SMS/email after every appointment',
    'Negatief-filter beschermt je reputatie': 'Negative filter protects your reputation', 'Centraal review-dashboard': 'Central review dashboard',
    'CRM & Klantendashboard': 'CRM & customer dashboard',
    'Eén dashboard waar alle communicatie samenkomt. Geen klant valt nog tussen de mazen.': 'One dashboard where all communication comes together. No customer slips through the cracks.',
    'WhatsApp, Instagram, e-mail, SMS, telefoongesprekken — alles in één unified inbox. Volledige klantgeschiedenis met notities, tags en pipeline-status op één scherm.':
      'WhatsApp, Instagram, email, SMS, phone calls — all in one unified inbox. Full customer history with notes, tags and pipeline status on a single screen.',
    'Unified inbox (alle kanalen)': 'Unified inbox (all channels)', 'Tags, notities & pipelines': 'Tags, notes & pipelines',
    'Mobile app & team-toegang': 'Mobile app & team access', 'Email & SMS campagnes': 'Email & SMS campaigns',
    'Nieuwsbrieven, promo-acties en seizoensaanbiedingen naar je hele database.': 'Newsletters, promotions and seasonal offers to your entire database.',
    'Segmenteer klanten per type en stuur gerichte campagnes via e-mail of SMS. Drip-sequences starten automatisch op basis van gedrag, met volledige open- en click-tracking.':
      'Segment customers by type and send targeted campaigns via email or SMS. Drip sequences start automatically based on behavior, with full open and click tracking.',
    'Klantsegmentatie & drip-sequences': 'Customer segmentation & drip sequences', 'A/B testing & analytics': 'A/B testing & analytics',
    'High-converting pagina\'s voor Google Ads, Meta Ads of promocampagnes.': 'High-converting pages for Google Ads, Meta Ads or promo campaigns.',
    'Eén focus per pagina — één duidelijke conversie. Mobile-first ontworpen voor maximale snelheid, met geïntegreerde formulieren die direct naar je CRM gaan.':
      'One focus per page — one clear conversion. Designed mobile-first for maximum speed, with integrated forms that go straight to your CRM.',
    'Eén doel per pagina, supersnel': 'One goal per page, super fast', 'Directe CRM-integratie': 'Direct CRM integration',
    'A/B testing & pixel tracking': 'A/B testing & pixel tracking', 'Online betalingen & facturatie': 'Online payments & invoicing',
    'Stripe-integratie voor terugkerende betalingen, automatische facturen en herinneringen.': 'Stripe integration for recurring payments, automatic invoices and reminders.',
    'Eénmalige betalingen, abonnementen of pay-per-use — alles via Stripe. Direct na betaling vertrekt automatisch een factuur, en onbetaalde facturen krijgen automatische herinneringen.':
      'One-time payments, subscriptions or pay-per-use — all via Stripe. An invoice goes out automatically right after payment, and unpaid invoices get automatic reminders.',
    'Subscriptions & eenmalige betalingen': 'Subscriptions & one-time payments', 'Klantportaal voor zelf raadplegen': 'Self-service customer portal',
    'Hoe we werken': 'How we work', 'Van strategie tot live,': 'From strategy to live,', 'zonder ruis.': 'without noise.',
    'Strategie': 'Strategy', 'We starten met een helder gesprek over doelen, doelgroep, positionering en opportuniteiten.': 'We start with a clear conversation about goals, audience, positioning and opportunities.',
    'Design': 'Design', 'We vertalen de strategie naar een strakke visuele richting en converterende gebruikersflow.': 'We translate the strategy into a sharp visual direction and a converting user flow.',
    'Bouw': 'Build', 'Daarna ontwikkelen we alles performant, schaalbaar en technisch netjes afgewerkt.': 'Then we develop everything: performant, scalable and technically polished.',
    'Lancering & optimalisatie': 'Launch & optimization', 'Na livegang blijven we meten, verfijnen en ondersteunen waar nodig.': 'After going live we keep measuring, refining and supporting where needed.',
    'Niet zeker welke diensten': 'Not sure which services', 'jij nodig hebt?': 'you need?',
    'Boek een gratis gesprek van 30 minuten. We bekijken samen waar jouw bedrijf staat en welke combinatie het meeste impact heeft. Geen verplichtingen.':
      'Book a free 30-minute call. We look together at where your business stands and which combination has the most impact. No obligations.',
    'Plan een gesprek': 'Book a call',

    /* ── OVER ONS ── */
    'Over ons': 'About', 'Wij bouwen systemen die': 'We build systems that', 'klanten opleveren.': 'deliver customers.',
    'De meeste bedrijven hebben een website, maar geen systeem dat echt werkt.': 'Most businesses have a website, but no system that actually works.',
    'Automatisatie': 'Automation', 'Systemen': 'Systems', 'Neem contact op': 'Get in touch',
    'Waarom wij bestaan': 'Why we exist', 'De meeste bedrijven hebben tools.': 'Most businesses have tools.',
    'Maar geen systeem dat echt werkt.': 'But no system that actually works.',
    'Geen structuur': 'No structure', 'Bezoekers komen binnen, maar weten niet wat ze moeten doen.': 'Visitors arrive, but don\'t know what to do.',
    'Geen opvolging': 'No follow-up', 'Leads verdwijnen omdat er geen systeem achter zit.': 'Leads disappear because there\'s no system behind them.',
    'Losse tools': 'Scattered tools', 'Alles werkt apart en niets sluit op elkaar aan.': 'Everything works separately and nothing connects.',
    'Daardoor verliezen bedrijven elke dag klanten.': 'As a result, businesses lose customers every day.', 'Dat is exact wat wij oplossen.': 'That\'s exactly what we solve.',
    'Onze aanpak': 'Our approach', 'Wij bouwen geen websites.': 'We don\'t build websites.', 'Wij bouwen systemen.': 'We build systems.',
    'Alles wat we doen is gebouwd om klanten te genereren.': 'Everything we do is built to generate customers.',
    'Geen design-only': 'Not design-only', 'Mooie websites zonder strategie leveren niets op.': 'Beautiful websites without strategy deliver nothing.',
    'Alles werkt samen': 'Everything works together', 'Website, opvolging en systemen versterken elkaar.': 'Website, follow-up and systems reinforce each other.',
    'Gebouwd voor groei': 'Built for growth', 'Klaar om te schalen vanaf dag één.': 'Ready to scale from day one.',
    'Waar wij voor staan': 'What we stand for', 'Drie principes,': 'Three principles,', 'geen compromissen.': 'no compromises.',
    'Resultaat': 'Results', 'Alles wat we bouwen moet klanten opleveren.': 'Everything we build must deliver customers.',
    'Snelheid': 'Speed', 'Binnen 14 dagen live en klaar om te groeien.': 'Live within 14 days and ready to grow.',
    'Focus': 'Focus', 'Geen afleiding. Alleen wat werkt.': 'No distraction. Only what works.',
    'Het team': 'The team', 'De mensen achter': 'The people behind', 'Wij bouwen systemen die bedrijven laten groeien.': 'We build systems that help businesses grow.',
    'Strategie & Groei': 'Strategy & Growth', 'Focus op structuur, positioning en systemen die klanten genereren.': 'Focused on structure, positioning and systems that generate customers.',
    'Automatisatie & Implementatie': 'Automation & Implementation', 'Zorgt dat alles technisch werkt en perfect samenkomt.': 'Makes sure everything works technically and comes together perfectly.',
    'Erkend en zichtbaar': 'Recognized and visible', 'Opgepikt door media': 'Picked up by media', 'en bedrijven.': 'and businesses.',
    'EM Launchpad groeit snel en wordt opgepikt door media en bedrijven.': 'EM Launchpad is growing fast and getting picked up by media and businesses.',
    'Projecten gebouwd': 'Projects built', 'Gemiddelde groei': 'Average growth', 'Systemen actief': 'Systems active', 'Gemiddeld tot live': 'Average to live',
    'Resultaten die spreken': 'Results that speak', 'Wat er gebeurt wanneer': 'What happens when', 'alles samenwerkt.': 'everything works together.',
    'Nieuwe structuur en duidelijke flow zorgden voor meer aanvragen.': 'New structure and a clear flow led to more inquiries.',
    'aanvragen': 'inquiries', 'conversie': 'conversion', 'Klaar om': 'Ready to', 'te groeien?': 'grow?',
    'Laat ons kijken waar jouw grootste kansen liggen.': 'Let us look at where your biggest opportunities lie.',

    /* ── CONTACT ── */
    '7 dagen op 7 bereikbaar · antwoord binnen 4 uur': 'Reachable 7 days a week · reply within 4 hours', 'Laten we': 'Let\'s', 'praten.': 'talk.',
    'Een vraag? Een project? Of gewoon even kennismaken? We zijn rechtstreeks bereikbaar — geen ticketsysteem, geen wachtrijen.':
      'A question? A project? Or just to get acquainted? We\'re directly reachable — no ticket system, no queues.',
    'Telefoon': 'Phone', 'E-mail': 'Email', 'Locatie': 'Location', 'Limburg · België': 'Limburg · Belgium', 'Actief in heel het land': 'Active across the country',
    'Ma — Vr': 'Mon — Fri', 'Za — Zo': 'Sat — Sun', 'Op afspraak': 'By appointment', 'Beschikbaar': 'Available', '7 dagen op 7': '7 days a week',
    'Stuur ons een bericht': 'Send us a message',
    'Vul het formulier in en we nemen binnen 24 uur contact op met een concreet voorstel of een gratis gesprek.':
      'Fill in the form and we\'ll get back to you within 24 hours with a concrete proposal or a free call.',
    'Naam': 'Name', 'Bericht': 'Message', 'Verstuur bericht': 'Send message', 'Formulier laadt niet? Mail ons direct op': 'Form not loading? Email us directly at',
    'Liever een andere weg?': 'Prefer another way?', 'Kies wat voor': 'Choose what works for', 'jou werkt.': 'you.', 'We zijn op elk kanaal even snel.': 'We\'re just as fast on every channel.',
    'Bel ons direct': 'Call us directly', 'Snelste manier om antwoord te krijgen. We nemen zelf op.': 'Fastest way to get an answer. We pick up ourselves.', 'Bel nu': 'Call now',
    '30 minuten online of telefoon. Kies zelf je moment in onze agenda.': '30 minutes online or by phone. Pick your slot in our calendar.', 'Open agenda': 'Open calendar',
    'Stuur een berichtje en we antwoorden binnen het uur (tijdens werkdagen).': 'Send a message and we\'ll reply within the hour (on weekdays).', 'Open chat': 'Open chat',
    'Hoe snel krijg ik antwoord?': 'How fast do I get a reply?',
    '7 dagen op 7 binnen 4 uur op formulieren en e-mails. Telefoon en WhatsApp gaan meestal sneller — binnen het uur. Ook in het weekend.':
      '7 days a week within 4 hours for forms and emails. Phone and WhatsApp are usually faster — within the hour. Weekends too.',
    'Krijg ik direct een offerte?': 'Do I get a quote right away?',
    'Nee — eerst plannen we een kort gesprek om je situatie en doelen te begrijpen. Pas dan kunnen we een realistisch voorstel maken dat écht bij jouw bedrijf past. Geen pre-fab offertes met cijfers uit de lucht.':
      'No — first we schedule a short call to understand your situation and goals. Only then can we make a realistic proposal that truly fits your business. No pre-fab quotes with numbers pulled from thin air.',
    'Kunnen we ergens fysiek afspreken?': 'Can we meet in person somewhere?',
    'Zeker. We komen graag bij jou ter plaatse in heel België — of jij komt naar Antwerpen of Limburg. De meeste klanten kiezen voor een eerste online gesprek (sneller en efficiënter), maar het mag perfect fysiek.':
      'Sure. We\'re happy to come to you anywhere in Belgium — or you come to Antwerp or Limburg. Most clients choose a first online call (faster and more efficient), but in person is perfectly fine.',
    'Werken jullie ook met startups?': 'Do you work with startups too?',
    'Ja, we hebben verschillende pakketten — van een eerste website voor een startend bedrijf tot complete AI-stack voor groeiende KMO\'s. We bekijken samen wat realistisch is binnen jouw budget.':
      'Yes, we have various packages — from a first website for a starting business to a complete AI stack for growing SMEs. We look together at what\'s realistic within your budget.',
    'Geen tijd om te wachten?': 'No time to wait?', 'Plan direct een gesprek.': 'Book a call right away.',
    'Kies zelf een moment in onze agenda — vandaag nog mogelijk. 30 minuten, geen verplichtingen.': 'Pick a slot in our calendar — possible as early as today. 30 minutes, no obligations.',

    /* ── AI CHATBOTS ── */
    'Een AI-assistent die': 'An AI assistant that', 'nooit slaapt.': 'never sleeps.',
    'Beantwoordt vragen, kwalificeert leads en boekt afspraken — op je website, WhatsApp, Instagram en Messenger. Getraind op jóuw bedrijf, jouw toon en jouw aanbod.':
      'Answers questions, qualifies leads and books appointments — on your website, WhatsApp, Instagram and Messenger. Trained on YOUR business, your tone and your offering.',
    '24/7 bereikbaar': 'Available 24/7', 'Antwoord in < 2 sec': 'Replies in < 2 sec', 'Boekt afspraken': 'Books appointments',
    'Bekijk live demo': 'See live demo', 'Ik automatiseer uw workflows': 'I automate your workflows', 'Afspraak ingepland ✓': 'Appointment scheduled ✓', 'Chat met mij': 'Chat with me',
    'Overal aanwezig': 'Everywhere at once', 'Eén bot.': 'One bot.', 'Al je kanalen.': 'All your channels.',
    'Je klanten kiezen waar ze praten — je chatbot is overal, met dezelfde kennis en dezelfde toon.': 'Your customers choose where to talk — your chatbot is everywhere, with the same knowledge and tone.',
    'Een chat-widget die bezoekers direct helpt en omzet in leads.': 'A chat widget that helps visitors instantly and turns them into leads.',
    'Beantwoord vragen waar je klanten al chatten — automatisch.': 'Answer questions where your customers already chat — automatically.',
    'DM\'s en story-reacties worden automatisch opgevolgd.': 'DMs and story replies are followed up automatically.',
    'Facebook-berichten worden direct en persoonlijk beantwoord.': 'Facebook messages get an instant, personal reply.',
    'Wat het doet': 'What it does', 'Meer dan vragen beantwoorden.': 'More than answering questions.', 'Het laat je groeien.': 'It makes you grow.',
    'Vragen beantwoorden': 'Answer questions', 'Openingsuren, prijzen, beschikbaarheid, diensten — direct en correct, dag en nacht.': 'Opening hours, prices, availability, services — instant and correct, day and night.',
    'Stelt de juiste vragen, herkent koopintentie en stuurt warme leads naar je CRM.': 'Asks the right questions, spots buying intent and sends warm leads to your CRM.',
    'Afspraken boeken': 'Book appointments', 'Toont vrije momenten en plant rechtstreeks in je agenda — in minder dan 2 minuten.': 'Shows free slots and books directly in your calendar — in under 2 minutes.',
    'Doorschakelen naar een mens': 'Hand off to a human', 'Complexe vraag? De bot draagt het gesprek naadloos over aan jou of je team.': 'Complex question? The bot hands the conversation off seamlessly to you or your team.',
    'Antwoordt automatisch in NL, FR, EN of DE — in de taal van je klant.': 'Replies automatically in NL, FR, EN or DE — in your customer\'s language.',
    'Getraind op jouw bedrijf': 'Trained on your business', 'Geen generieke bot. Geladen met jouw diensten, toon en veelgestelde vragen.': 'Not a generic bot. Loaded with your services, tone and frequently asked questions.',
    'Live demo': 'Live demo', 'Zo voelt een gesprek': 'This is how a conversation feels', 'met je bot.': 'with your bot.',
    'Natuurlijk, snel en altijd on-brand. De bot begrijpt context, stelt vervolgvragen en sluit af met een concrete actie — een geboekte afspraak of een gekwalificeerde lead.':
      'Natural, fast and always on-brand. The bot understands context, asks follow-up questions and ends with a concrete action — a booked appointment or a qualified lead.',
    'Begrijpt natuurlijke taal, geen keuzemenu\'s': 'Understands natural language, no menus', 'Onthoudt context binnen het gesprek': 'Remembers context within the conversation',
    'Eindigt altijd met een duidelijke actie': 'Always ends with a clear action', 'Ik wil dit voor mijn bedrijf': 'I want this for my business',
    'Typ een bericht…': 'Type a message…', 'Hoe het werkt': 'How it works', 'Van briefing tot': 'From briefing to', 'live binnen dagen.': 'live within days.',
    'Intake & training': 'Intake & training', 'Kanalen koppelen': 'Connect channels', 'Testen & finetunen': 'Test & fine-tune', 'Live & optimaliseren': 'Live & optimize',
    'We voeden de bot met je diensten, prijzen, FAQ en toon — zodat hij klinkt als jouw bedrijf, niet als een generieke assistent.':
      'We feed the bot your services, prices, FAQ and tone — so it sounds like your business, not a generic assistant.',
    'Website, WhatsApp, Instagram en Messenger worden aangesloten op één centraal brein met dezelfde kennis en toon.':
      'Website, WhatsApp, Instagram and Messenger are connected to one central brain with the same knowledge and tone.',
    'We spelen echte scenario\'s na en verfijnen de antwoorden tot elk gesprek natuurlijk en correct verloopt.':
      'We replay real scenarios and refine the answers until every conversation flows naturally and correctly.',
    'De bot gaat live en wordt maandelijks bijgestuurd op basis van echte gesprekken en nieuwe vragen.':
      'The bot goes live and is adjusted monthly based on real conversations and new questions.',
    'Klinkt de bot niet robotachtig?': 'Doesn\'t the bot sound robotic?',
    'Nee. We trainen de bot op jouw toon en schrijfstijl. Hij begrijpt natuurlijke taal — geen starre keuzemenu\'s — en de meeste klanten merken niet eens dat ze met AI praten.':
      'No. We train the bot on your tone and writing style. It understands natural language — no rigid menus — and most customers don\'t even notice they\'re talking to AI.',
    'Wat als de bot iets niet weet?': 'What if the bot doesn\'t know something?',
    'Dan draagt hij het gesprek naadloos over aan jou of je team, of plant een terugbelmoment in. Hij verzint nooit antwoorden — eerlijkheid boven alles.':
      'Then it hands the conversation off seamlessly to you or your team, or schedules a callback. It never makes up answers — honesty above all.',
    'Op welke kanalen werkt het?': 'Which channels does it work on?',
    'Website, WhatsApp, Instagram en Facebook Messenger — allemaal aangestuurd door hetzelfde brein, met dezelfde kennis en toon op elk kanaal.':
      'Website, WhatsApp, Instagram and Facebook Messenger — all driven by the same brain, with the same knowledge and tone on every channel.',
    'Hoe snel kan de bot live?': 'How fast can the bot go live?',
    'Een chatbot staat doorgaans binnen enkele dagen live. Na intake en training testen we grondig en gaan we online — meestal binnen 14 dagen, vaak sneller.':
      'A chatbot is usually live within a few days. After intake and training we test thoroughly and go online — usually within 14 days, often sooner.',
    'Klaar voor een assistent die': 'Ready for an assistant that', 'nooit een lead mist?': 'never misses a lead?',
    'Plan een gratis gesprek van 30 minuten. We bouwen je bot op maat en zetten hem live op al je kanalen.':
      'Book a free 30-minute call. We build your bot custom and put it live on all your channels.',

    /* ── AI VOICE AGENTS ── */
    'Een stem die': 'A voice that', 'elke oproep aanneemt.': 'answers every call.',
    'Een mensachtige AI-receptionist die 24/7 opneemt, vragen beantwoordt en afspraken inplant — in meerdere talen. Geen gemiste oproepen, geen voicemail, geen wachtmuziek.':
      'A human-like AI receptionist that picks up 24/7, answers questions and schedules appointments — in multiple languages. No missed calls, no voicemail, no hold music.',
    'Neemt op in 1 ring': 'Picks up in 1 ring', 'Klinkt menselijk': 'Sounds human', 'Boekt in je agenda': 'Books in your calendar', 'Probeer de demo': 'Try the demo',
    'EM Voice Agent': 'EM Voice Agent', 'Inkomende oproep · +32 …': 'Incoming call · +32 …', 'Stand-by': 'Stand-by', 'Beantwoord de oproep': 'Answer the call',
    'Druk op': 'Press', 'Beantwoord': 'Answer', 'om een live gesprek te horen meelopen.': 'to follow a live conversation.',
    'van de oproepen beantwoord': 'of calls answered', 'ring tot opnemen': 'ring to pick up', 'ook \'s nachts & weekend': 'nights & weekends too', 'talen vloeiend': 'languages fluently',
    'Wat hij voor je doet': 'What it does for you', 'Eén stem,': 'One voice,', 'elke situatie.': 'every situation.', 'Kies een scenario en zie hoe de voice agent het afhandelt.': 'Choose a scenario and see how the voice agent handles it.',
    'Afspraken inplannen': 'Schedule appointments', 'Boekt rechtstreeks in je agenda': 'Books straight into your calendar', 'Uren, prijzen, route, diensten': 'Hours, prices, directions, services',
    'Filtert en noteert de juiste info': 'Filters and notes the right info', 'Doorverbinden': 'Transfer', 'Schakelt door naar jou of je team': 'Routes to you or your team',
    'Boekt afspraken terwijl jij werkt.': 'Books appointments while you work.',
    'De agent checkt je live beschikbaarheid, stelt passende tijdslots voor en bevestigt de afspraak in je agenda — met een automatische bevestiging via SMS of e-mail.':
      'The agent checks your live availability, suggests suitable time slots and confirms the appointment in your calendar — with an automatic confirmation via SMS or email.',
    'Live agenda-synchronisatie': 'Live calendar sync', 'Automatische bevestiging & herinnering': 'Automatic confirmation & reminder', 'Voorkomt dubbele boekingen': 'Prevents double bookings',
    'Beantwoordt elke vraag, direct.': 'Answers every question, instantly.',
    'Openingsuren, prijzen, beschikbaarheid, bereikbaarheid — de agent kent je bedrijf en geeft altijd het juiste antwoord, zonder de beller te laten wachten.':
      'Opening hours, prices, availability, accessibility — the agent knows your business and always gives the right answer, without keeping the caller waiting.',
    'Getraind op jouw bedrijfsinfo': 'Trained on your business info', 'Nooit "ik weet het niet"': 'Never "I don\'t know"', 'Consistent in elke taal': 'Consistent in every language',
    'Kwalificeert leads aan de telefoon.': 'Qualifies leads over the phone.',
    'Stelt de juiste vervolgvragen, noteert budget en behoefte, en stuurt een volledig samengevatte lead naar je CRM — klaar voor opvolging.':
      'Asks the right follow-up questions, notes budget and needs, and sends a fully summarized lead to your CRM — ready for follow-up.',
    'Herkent koopintentie': 'Spots buying intent', 'Volledige samenvatting in je CRM': 'Full summary in your CRM', 'Prioriteert warme leads': 'Prioritizes warm leads',
    'Verbindt door wanneer het moet.': 'Transfers when it needs to.',
    'Dringende of complexe oproep? De agent schakelt naadloos door naar jou of de juiste collega — of plant een terugbelmoment als er niemand vrij is.':
      'Urgent or complex call? The agent transfers seamlessly to you or the right colleague — or schedules a callback if no one is available.',
    'Slimme doorschakelregels': 'Smart routing rules', 'Terugbelafspraak bij geen gehoor': 'Callback scheduled if no answer', 'Niets gaat verloren': 'Nothing gets lost',
    'Waarom het werkt': 'Why it works', 'Werkt als een machine.': 'Works like a machine.',
    'Natuurlijke stem': 'Natural voice', 'Echte intonatie en pauzes — bellers merken nauwelijks dat het AI is.': 'Real intonation and pauses — callers barely notice it\'s AI.',
    'Neemt altijd op': 'Always picks up', 'Geen wachtrij, geen voicemail. Elke beller krijgt meteen antwoord.': 'No queue, no voicemail. Every caller gets an instant answer.',
    'Schakelt automatisch tussen NL, FR, EN en DE op basis van de beller.': 'Switches automatically between NL, FR, EN and DE based on the caller.',
    'Live synchronisatie met je kalender — geen dubbele boekingen.': 'Live sync with your calendar — no double bookings.',
    'Privacy & GDPR': 'Privacy & GDPR', 'Gesprekken worden veilig en conform de wetgeving verwerkt.': 'Conversations are processed securely and in line with the law.',
    'Live transcripties': 'Live transcriptions', 'Elke oproep wordt automatisch uitgeschreven en opgeslagen in je CRM.': 'Every call is automatically transcribed and saved in your CRM.',
    'Horen bellers dat het AI is?': 'Can callers tell it\'s AI?',
    'Zelden. De stem heeft natuurlijke intonatie en pauzes. We kunnen de agent zich ook gewoon als digitale assistent laten voorstellen — jij kiest hoe transparant het is.':
      'Rarely. The voice has natural intonation and pauses. We can also have the agent introduce itself as a digital assistant — you choose how transparent it is.',
    'Werkt het op mijn bestaande nummer?': 'Does it work on my existing number?',
    'Ja. We koppelen de agent aan je huidige nummer of zetten een doorschakeling op. Je hoeft niets te veranderen aan je telefoonabonnement.':
      'Yes. We link the agent to your current number or set up a forward. You don\'t have to change anything about your phone plan.',
    'Wat als de agent het antwoord niet weet?': 'What if the agent doesn\'t know the answer?',
    'Dan verbindt hij door naar jou of een collega, of plant een terugbelmoment in. Hij verzint nooit antwoorden — bij twijfel schakelt hij naar een mens.':
      'Then it transfers to you or a colleague, or schedules a callback. It never makes up answers — when in doubt, it switches to a human.',
    'Hoeveel oproepen kan hij tegelijk aan?': 'How many calls can it handle at once?',
    'Onbeperkt. Of er nu één of vijftig mensen tegelijk bellen — iedereen krijgt meteen antwoord. Geen wachtrij, geen gemiste oproepen tijdens piekmomenten.':
      'Unlimited. Whether one or fifty people call at once — everyone gets an instant answer. No queue, no missed calls during peak times.',
    'Laat geen enkele oproep': 'Don\'t leave a single call', 'nog onbeantwoord.': 'unanswered.',
    'Plan een gratis gesprek van 30 minuten. We zetten je voice agent op maat op en koppelen hem aan je nummer en agenda.':
      'Book a free 30-minute call. We set up your voice agent custom and connect it to your number and calendar.',

    /* shared sub-page bits */
    'Goed om': 'Good to', 'te weten.': 'know.', 'Meertalig': 'Multilingual',
    "Funnels & landingspagina's": 'Funnels & landing pages',
  });

  /* ── WEBSITES + AI-AUTOMATISERING ── */
  Object.assign(T.fr, {
    /* Websites */
    'Een website die': 'Un site web qui', 'werkt als verkoper.': 'travaille comme un vendeur.',
    'Snel, modern en gebouwd om te converteren — op elk scherm. Met ingebouwde afsprakenplanner, chatbot en lead-formulieren die rechtstreeks in je systeem terechtkomen.':
      'Rapide, moderne et conçu pour convertir — sur chaque écran. Avec planificateur de rendez-vous, chatbot et formulaires intégrés qui arrivent directement dans votre système.',
    'Razendsnel': 'Ultra-rapide', 'Conversiegericht': 'Axé conversion', 'Wat je krijgt': 'Ce que vous obtenez',
    'Desktop': 'Bureau', 'Tablet': 'Tablette', 'Mobiel': 'Mobile', 'jouwbedrijf.be': 'votreentreprise.be', 'Jouw Merk': 'Votre Marque',
    'Groei met een site die': 'Grandissez avec un site qui', 'klanten oplevert.': 'rapporte des clients.',
    'Performance': 'Performance', 'Toegankelijkheid': 'Accessibilité',
    'Geen brochure.': 'Pas une brochure.', 'Een verkoopmachine.': 'Une machine à vendre.',
    'Elke website bouwen we rond één doel: bezoekers omzetten in klanten.': 'Nous construisons chaque site autour d’un seul objectif : transformer les visiteurs en clients.',
    'Ontworpen voor de telefoon eerst — waar de meeste van je bezoekers vandaan komen.': 'Conçu d’abord pour le téléphone — d’où vient la majorité de vos visiteurs.',
    'Geoptimaliseerd voor Core Web Vitals. Snelle sites ranken hoger en converteren beter.': 'Optimisé pour les Core Web Vitals. Les sites rapides se classent mieux et convertissent plus.',
    'Schone structuur, snelle laadtijden en de juiste tags — zodat Google je vindt.': 'Structure propre, chargement rapide et bonnes balises — pour que Google vous trouve.',
    'Ingebouwde planner': 'Planificateur intégré', 'Bezoekers boeken direct een afspraak — zonder je site te verlaten.': 'Les visiteurs prennent rendez-vous directement — sans quitter votre site.',
    'Chatbot inbegrepen': 'Chatbot inclus', 'Een AI-assistent staat klaar om vragen te beantwoorden en leads te vangen.': 'Un assistant IA est prêt à répondre aux questions et capter des leads.',
    'Heldere call-to-actions en formulieren die rechtstreeks in je CRM landen.': 'Des appels à l’action clairs et des formulaires qui arrivent directement dans votre CRM.',
    'Van briefing tot': 'Du briefing à', 'live binnen 14 dagen.': 'en ligne en 14 jours.',
    'Strategie & structuur': 'Stratégie & structure', 'We bepalen je doel, doelgroep en de paden die bezoekers naar een conversie leiden.': 'Nous définissons votre objectif, votre audience et les parcours qui mènent à la conversion.',
    'Design op maat': 'Design sur mesure', 'Een strak ontwerp in jouw merkstijl — geen sjabloon, wel converterend.': 'Un design épuré dans votre identité de marque — pas un modèle, mais qui convertit.',
    'Bouw & integraties': 'Construction & intégrations', 'Snel, schaalbaar en gekoppeld aan planner, chatbot en CRM.': 'Rapide, évolutif et relié au planificateur, au chatbot et au CRM.',
    'We meten, testen en verfijnen na de lancering voor maximale conversie.': 'Nous mesurons, testons et affinons après le lancement pour une conversion maximale.',
    'Onder de motorkap': 'Sous le capot', 'Gebouwd op': 'Construit sur', 'moderne technologie.': 'une technologie moderne.',
    'CDN & caching': 'CDN & cache', 'A/B-testing': 'A/B testing', 'CRM-koppeling': 'Connexion CRM',
    'Krijg ik een website op maat of een sjabloon?': 'Ai-je un site sur mesure ou un modèle ?',
    'Altijd op maat. We ontwerpen rond jouw merk, doelgroep en doelen — geen kant-en-klaar thema dat iedereen heeft.':
      'Toujours sur mesure. Nous concevons autour de votre marque, votre audience et vos objectifs — pas un thème tout fait que tout le monde a.',
    'Kan ik zelf content aanpassen?': 'Puis-je modifier le contenu moi-même ?',
    'Ja. Je krijgt een eenvoudig systeem waarmee je teksten, foto\'s en aanbiedingen zelf kunt bijwerken — of wij doen het voor je.':
      'Oui. Vous recevez un système simple pour mettre à jour textes, photos et offres vous-même — ou nous le faisons pour vous.',
    'Zit hosting en onderhoud erbij?': 'L’hébergement et la maintenance sont-ils inclus ?',
    'Ja. Hosting, beveiliging, back-ups en updates zitten in een transparant maandbedrag. Je hoeft je nergens zorgen over te maken.':
      'Oui. Hébergement, sécurité, sauvegardes et mises à jour sont compris dans un montant mensuel transparent. Vous n’avez à vous soucier de rien.',
    'Werkt de site samen met jullie andere diensten?': 'Le site fonctionne-t-il avec vos autres services ?',
    'Helemaal. Chatbot, voice agent, CRM en automatisaties zijn al ingebouwd of klaar om te koppelen — alles in één systeem.':
      'Tout à fait. Chatbot, agent vocal, CRM et automatisations sont déjà intégrés ou prêts à connecter — tout dans un seul système.',
    'Klaar voor een site die': 'Prêt pour un site qui', 'echt klanten oplevert?': 'rapporte vraiment des clients ?',
    'Plan een gratis gesprek van 30 minuten. We bekijken samen wat je site moet doen — en bouwen hem live binnen 14 dagen.':
      'Réservez un appel gratuit de 30 minutes. Nous regardons ensemble ce que votre site doit faire — et le mettons en ligne en 14 jours.',

    /* AI-Automatisering */
    'AI-Automatisering': 'Automatisation IA', 'Laat het werk': 'Laissez le travail', 'zichzelf doen.': 'se faire tout seul.',
    'Slimme workflows met n8n en moderne AI-tools nemen repetitief werk over — lead-opvolging, herinneringen, reviewverzoeken en CRM-updates draaien automatisch op de achtergrond, dag en nacht.':
      'Des workflows intelligents avec n8n et des outils IA modernes prennent en charge le travail répétitif — suivi des leads, rappels, demandes d’avis et mises à jour CRM tournent automatiquement en arrière-plan, jour et nuit.',
    'Draait 24/7': 'Tourne 24/7', 'Nul handwerk': 'Zéro travail manuel', 'Koppelt al je tools': 'Connecte tous vos outils', 'Meerstaps': 'Multi-étapes',
    'Bekijk een workflow': 'Voir un workflow', 'workflow · nieuwe lead': 'workflow · nouveau lead', 'Start workflow': 'Démarrer le workflow',
    'trigger': 'déclencheur', 'Nieuwe lead binnen': 'Nouveau lead reçu', 'via chatbot of formulier': 'via chatbot ou formulaire',
    'actie': 'action', 'Lead toevoegen aan CRM': 'Ajouter le lead au CRM', 'met tags & bron': 'avec tags & source',
    'Welkomstmail versturen': 'Envoyer l’e-mail de bienvenue', 'direct & gepersonaliseerd': 'instantané & personnalisé',
    'vertraging': 'délai', 'Wacht 1 dag': 'Attendre 1 jour', 'geen reactie? volg op': 'pas de réponse ? relancer',
    'WhatsApp-herinnering': 'Rappel WhatsApp', 'met boekingslink': 'avec lien de réservation',
    'resultaat': 'résultat', 'Afspraak geboekt': 'Rendez-vous réservé', 'automatisch in agenda': 'automatiquement dans l’agenda',
    '6 stappen · 0 handwerk': '6 étapes · 0 travail manuel', 'Workflow voltooid': 'Workflow terminé',
    'bespaard per week': 'économisées par semaine', 'draait op de achtergrond': 'tourne en arrière-plan', 'vergeten opvolgingen': 'suivis oubliés',
    'Kant-en-klare workflows': 'Workflows prêts à l’emploi', 'Automatiseringen die': 'Des automatisations qui', 'meteen renderen.': 'rapportent aussitôt.',
    'Een greep uit wat we voor lokale bedrijven bouwen.': 'Un aperçu de ce que nous construisons pour les entreprises locales.',
    'Lead': 'Lead', 'Mail': 'Mail', 'Lead-opvolging': 'Suivi des leads',
    'Elke nieuwe lead wordt automatisch opgeslagen, getagd en krijgt direct een persoonlijke opvolging.': 'Chaque nouveau lead est automatiquement enregistré, tagué et reçoit aussitôt un suivi personnalisé.',
    'Afspraak': 'Rendez-vous', 'Review': 'Avis', 'Reviewverzoeken': 'Demandes d’avis',
    'Twee uur na een afspraak vertrekt automatisch een reviewverzoek — tevreden klanten gaan naar Google.': 'Deux heures après un rendez-vous, une demande d’avis part automatiquement — les clients satisfaits vont vers Google.',
    'Boeking': 'Réservation', 'No-show preventie': 'Prévention des absences',
    'Automatische herinneringen via SMS en e-mail verlagen het aantal gemiste afspraken drastisch.': 'Des rappels automatiques par SMS et e-mail réduisent drastiquement les rendez-vous manqués.',
    'Betaling': 'Paiement', 'Factuur': 'Facture', 'Facturatie': 'Facturation',
    'Na elke betaling vertrekt automatisch een factuur en wordt de klantstatus bijgewerkt.': 'Après chaque paiement, une facture part automatiquement et le statut du client est mis à jour.',
    'Formulier': 'Formulaire', 'Routing': 'Routage', 'Team': 'Équipe', 'Lead routing': 'Routage des leads',
    'Aanvragen worden automatisch naar de juiste persoon of afdeling gestuurd — niets blijft liggen.': 'Les demandes sont automatiquement dirigées vers la bonne personne ou le bon service — rien ne traîne.',
    'Segment': 'Segment', 'Campagne': 'Campagne', 'Track': 'Suivi', 'Campagnes': 'Campagnes',
    'Gerichte e-mail- en SMS-campagnes starten automatisch op basis van klantgedrag.': 'Des campagnes e-mail et SMS ciblées démarrent automatiquement selon le comportement client.',
    'Waarom automatiseren': 'Pourquoi automatiser', 'Minder handwerk.': 'Moins de travail manuel.', 'Meer resultaat.': 'Plus de résultats.',
    'Bespaar tijd': 'Gagnez du temps', 'Repetitieve taken draaien vanzelf — jij en je team houden tijd over voor echt werk.': 'Les tâches répétitives tournent toutes seules — vous et votre équipe gardez du temps pour le vrai travail.',
    'Geen fouten meer': 'Plus d’erreurs', 'Geen vergeten opvolgingen of dubbel werk. Het systeem doet het elke keer correct.': 'Plus de suivis oubliés ni de double travail. Le système le fait correctement à chaque fois.',
    'Koppelt alles': 'Connecte tout', 'Website, CRM, agenda, betalingen en communicatie spreken automatisch met elkaar.': 'Site, CRM, agenda, paiements et communication communiquent automatiquement.',
    'Reageert direct': 'Réagit instantanément', 'Leads krijgen meteen opvolging — snelheid is het verschil tussen winnen en verliezen.': 'Les leads sont suivis immédiatement — la rapidité fait la différence entre gagner et perdre.',
    'Schaalt mee': 'Évolue avec vous', 'Of je nu 10 of 1000 leads per maand krijgt — het systeem draait zonder extra werk.': 'Que vous receviez 10 ou 1000 leads par mois — le système tourne sans travail supplémentaire.',
    'Volledig inzicht': 'Visibilité totale', 'Zie precies wat er draait, wat werkt en waar je kunt optimaliseren.': 'Voyez exactement ce qui tourne, ce qui marche et où optimiser.',
    'Moet ik zelf workflows bouwen?': 'Dois-je construire les workflows moi-même ?',
    'Nee. Wij ontwerpen, bouwen en onderhouden alle workflows voor je. Jij ziet enkel het resultaat: meer tijd en minder gemiste kansen.':
      'Non. Nous concevons, construisons et maintenons tous les workflows pour vous. Vous ne voyez que le résultat : plus de temps et moins d’opportunités manquées.',
    'Werkt het met mijn bestaande tools?': 'Ça marche avec mes outils existants ?',
    'Vrijwel altijd. Via n8n koppelen we honderden tools — agenda\'s, CRM\'s, betaalsystemen, WhatsApp, e-mail en meer.':
      'Presque toujours. Via n8n, nous connectons des centaines d’outils — agendas, CRM, systèmes de paiement, WhatsApp, e-mail et plus.',
    'Wat als er iets misgaat in een workflow?': 'Et si quelque chose tourne mal dans un workflow ?',
    'We monitoren alles. Bij een fout krijg je (en wij) een melding, en we lossen het op voordat het impact heeft op je klanten.':
      'Nous surveillons tout. En cas d’erreur, vous (et nous) recevez une alerte, et nous la résolvons avant qu’elle n’affecte vos clients.',
    'Kan ik klein beginnen?': 'Puis-je commencer petit ?',
    'Zeker. Veel klanten starten met één workflow — bijvoorbeeld lead-opvolging — en breiden uit zodra ze het resultaat zien.':
      'Bien sûr. Beaucoup de clients démarrent avec un seul workflow — par exemple le suivi des leads — et l’étendent dès qu’ils voient le résultat.',
    'Klaar om werk': 'Prêt à enlever du travail', 'van je bord te halen?': 'de vos épaules ?',
    'Plan een gratis gesprek van 30 minuten. We brengen samen in kaart welke workflows jou het meeste tijd en omzet opleveren.':
      'Réservez un appel gratuit de 30 minutes. Nous cartographions ensemble les workflows qui vous rapportent le plus de temps et de chiffre d’affaires.',
  });

  Object.assign(T.en, {
    /* Websites */
    'Een website die': 'A website that', 'werkt als verkoper.': 'works like a salesperson.',
    'Snel, modern en gebouwd om te converteren — op elk scherm. Met ingebouwde afsprakenplanner, chatbot en lead-formulieren die rechtstreeks in je systeem terechtkomen.':
      'Fast, modern and built to convert — on every screen. With a built-in scheduler, chatbot and lead forms that land straight in your system.',
    'Razendsnel': 'Lightning fast', 'Conversiegericht': 'Conversion-focused', 'Wat je krijgt': 'What you get',
    'Desktop': 'Desktop', 'Tablet': 'Tablet', 'Mobiel': 'Mobile', 'jouwbedrijf.be': 'yourbusiness.com', 'Jouw Merk': 'Your Brand',
    'Groei met een site die': 'Grow with a site that', 'klanten oplevert.': 'delivers customers.',
    'Performance': 'Performance', 'Toegankelijkheid': 'Accessibility',
    'Geen brochure.': 'Not a brochure.', 'Een verkoopmachine.': 'A sales machine.',
    'Elke website bouwen we rond één doel: bezoekers omzetten in klanten.': 'We build every website around one goal: turning visitors into customers.',
    'Ontworpen voor de telefoon eerst — waar de meeste van je bezoekers vandaan komen.': 'Designed for the phone first — where most of your visitors come from.',
    'Geoptimaliseerd voor Core Web Vitals. Snelle sites ranken hoger en converteren beter.': 'Optimized for Core Web Vitals. Fast sites rank higher and convert better.',
    'Schone structuur, snelle laadtijden en de juiste tags — zodat Google je vindt.': 'Clean structure, fast load times and the right tags — so Google finds you.',
    'Ingebouwde planner': 'Built-in scheduler', 'Bezoekers boeken direct een afspraak — zonder je site te verlaten.': 'Visitors book an appointment directly — without leaving your site.',
    'Chatbot inbegrepen': 'Chatbot included', 'Een AI-assistent staat klaar om vragen te beantwoorden en leads te vangen.': 'An AI assistant is ready to answer questions and capture leads.',
    'Heldere call-to-actions en formulieren die rechtstreeks in je CRM landen.': 'Clear calls-to-action and forms that land straight in your CRM.',
    'Van briefing tot': 'From briefing to', 'live binnen 14 dagen.': 'live within 14 days.',
    'Strategie & structuur': 'Strategy & structure', 'We bepalen je doel, doelgroep en de paden die bezoekers naar een conversie leiden.': 'We define your goal, audience and the paths that lead visitors to a conversion.',
    'Design op maat': 'Custom design', 'Een strak ontwerp in jouw merkstijl — geen sjabloon, wel converterend.': 'A sharp design in your brand style — no template, but converting.',
    'Bouw & integraties': 'Build & integrations', 'Snel, schaalbaar en gekoppeld aan planner, chatbot en CRM.': 'Fast, scalable and connected to scheduler, chatbot and CRM.',
    'We meten, testen en verfijnen na de lancering voor maximale conversie.': 'We measure, test and refine after launch for maximum conversion.',
    'Onder de motorkap': 'Under the hood', 'Gebouwd op': 'Built on', 'moderne technologie.': 'modern technology.',
    'CDN & caching': 'CDN & caching', 'A/B-testing': 'A/B testing', 'CRM-koppeling': 'CRM integration',
    'Krijg ik een website op maat of een sjabloon?': 'Do I get a custom website or a template?',
    'Altijd op maat. We ontwerpen rond jouw merk, doelgroep en doelen — geen kant-en-klaar thema dat iedereen heeft.':
      'Always custom. We design around your brand, audience and goals — not an off-the-shelf theme everyone has.',
    'Kan ik zelf content aanpassen?': 'Can I edit content myself?',
    'Ja. Je krijgt een eenvoudig systeem waarmee je teksten, foto\'s en aanbiedingen zelf kunt bijwerken — of wij doen het voor je.':
      'Yes. You get a simple system to update texts, photos and offers yourself — or we do it for you.',
    'Zit hosting en onderhoud erbij?': 'Are hosting and maintenance included?',
    'Ja. Hosting, beveiliging, back-ups en updates zitten in een transparant maandbedrag. Je hoeft je nergens zorgen over te maken.':
      'Yes. Hosting, security, backups and updates are included in a transparent monthly fee. You don\'t have to worry about a thing.',
    'Werkt de site samen met jullie andere diensten?': 'Does the site work with your other services?',
    'Helemaal. Chatbot, voice agent, CRM en automatisaties zijn al ingebouwd of klaar om te koppelen — alles in één systeem.':
      'Completely. Chatbot, voice agent, CRM and automations are already built in or ready to connect — all in one system.',
    'Klaar voor een site die': 'Ready for a site that', 'echt klanten oplevert?': 'truly delivers customers?',
    'Plan een gratis gesprek van 30 minuten. We bekijken samen wat je site moet doen — en bouwen hem live binnen 14 dagen.':
      'Book a free 30-minute call. We look together at what your site needs to do — and build it live within 14 days.',

    /* AI-Automatisering */
    'AI-Automatisering': 'AI Automation', 'Laat het werk': 'Let the work', 'zichzelf doen.': 'do itself.',
    'Slimme workflows met n8n en moderne AI-tools nemen repetitief werk over — lead-opvolging, herinneringen, reviewverzoeken en CRM-updates draaien automatisch op de achtergrond, dag en nacht.':
      'Smart workflows with n8n and modern AI tools take over repetitive work — lead follow-up, reminders, review requests and CRM updates run automatically in the background, day and night.',
    'Draait 24/7': 'Runs 24/7', 'Nul handwerk': 'Zero manual work', 'Koppelt al je tools': 'Connects all your tools', 'Meerstaps': 'Multi-step',
    'Bekijk een workflow': 'See a workflow', 'workflow · nieuwe lead': 'workflow · new lead', 'Start workflow': 'Start workflow',
    'trigger': 'trigger', 'Nieuwe lead binnen': 'New lead received', 'via chatbot of formulier': 'via chatbot or form',
    'actie': 'action', 'Lead toevoegen aan CRM': 'Add lead to CRM', 'met tags & bron': 'with tags & source',
    'Welkomstmail versturen': 'Send welcome email', 'direct & gepersonaliseerd': 'instant & personalized',
    'vertraging': 'delay', 'Wacht 1 dag': 'Wait 1 day', 'geen reactie? volg op': 'no reply? follow up',
    'WhatsApp-herinnering': 'WhatsApp reminder', 'met boekingslink': 'with booking link',
    'resultaat': 'result', 'Afspraak geboekt': 'Appointment booked', 'automatisch in agenda': 'automatically in calendar',
    '6 stappen · 0 handwerk': '6 steps · 0 manual work', 'Workflow voltooid': 'Workflow complete',
    'bespaard per week': 'saved per week', 'draait op de achtergrond': 'runs in the background', 'vergeten opvolgingen': 'forgotten follow-ups',
    'Kant-en-klare workflows': 'Ready-made workflows', 'Automatiseringen die': 'Automations that', 'meteen renderen.': 'pay off instantly.',
    'Een greep uit wat we voor lokale bedrijven bouwen.': 'A glimpse of what we build for local businesses.',
    'Lead': 'Lead', 'Mail': 'Mail', 'Lead-opvolging': 'Lead follow-up',
    'Elke nieuwe lead wordt automatisch opgeslagen, getagd en krijgt direct een persoonlijke opvolging.': 'Every new lead is automatically saved, tagged and gets an instant personal follow-up.',
    'Afspraak': 'Appointment', 'Review': 'Review', 'Reviewverzoeken': 'Review requests',
    'Twee uur na een afspraak vertrekt automatisch een reviewverzoek — tevreden klanten gaan naar Google.': 'Two hours after an appointment a review request goes out automatically — happy customers go to Google.',
    'Boeking': 'Booking', 'No-show preventie': 'No-show prevention',
    'Automatische herinneringen via SMS en e-mail verlagen het aantal gemiste afspraken drastisch.': 'Automatic reminders via SMS and email drastically reduce missed appointments.',
    'Betaling': 'Payment', 'Factuur': 'Invoice', 'Facturatie': 'Invoicing',
    'Na elke betaling vertrekt automatisch een factuur en wordt de klantstatus bijgewerkt.': 'After every payment an invoice goes out automatically and the customer status is updated.',
    'Formulier': 'Form', 'Routing': 'Routing', 'Team': 'Team', 'Lead routing': 'Lead routing',
    'Aanvragen worden automatisch naar de juiste persoon of afdeling gestuurd — niets blijft liggen.': 'Inquiries are automatically routed to the right person or department — nothing falls through.',
    'Segment': 'Segment', 'Campagne': 'Campaign', 'Track': 'Track', 'Campagnes': 'Campaigns',
    'Gerichte e-mail- en SMS-campagnes starten automatisch op basis van klantgedrag.': 'Targeted email and SMS campaigns start automatically based on customer behavior.',
    'Waarom automatiseren': 'Why automate', 'Minder handwerk.': 'Less manual work.', 'Meer resultaat.': 'More results.',
    'Bespaar tijd': 'Save time', 'Repetitieve taken draaien vanzelf — jij en je team houden tijd over voor echt werk.': 'Repetitive tasks run on their own — you and your team keep time for real work.',
    'Geen fouten meer': 'No more mistakes', 'Geen vergeten opvolgingen of dubbel werk. Het systeem doet het elke keer correct.': 'No forgotten follow-ups or double work. The system does it correctly every time.',
    'Koppelt alles': 'Connects everything', 'Website, CRM, agenda, betalingen en communicatie spreken automatisch met elkaar.': 'Website, CRM, calendar, payments and communication talk to each other automatically.',
    'Reageert direct': 'Responds instantly', 'Leads krijgen meteen opvolging — snelheid is het verschil tussen winnen en verliezen.': 'Leads get instant follow-up — speed is the difference between winning and losing.',
    'Schaalt mee': 'Scales with you', 'Of je nu 10 of 1000 leads per maand krijgt — het systeem draait zonder extra werk.': 'Whether you get 10 or 1000 leads a month — the system runs without extra work.',
    'Volledig inzicht': 'Full visibility', 'Zie precies wat er draait, wat werkt en waar je kunt optimaliseren.': 'See exactly what\'s running, what works and where to optimize.',
    'Moet ik zelf workflows bouwen?': 'Do I have to build workflows myself?',
    'Nee. Wij ontwerpen, bouwen en onderhouden alle workflows voor je. Jij ziet enkel het resultaat: meer tijd en minder gemiste kansen.':
      'No. We design, build and maintain all workflows for you. You only see the result: more time and fewer missed opportunities.',
    'Werkt het met mijn bestaande tools?': 'Does it work with my existing tools?',
    'Vrijwel altijd. Via n8n koppelen we honderden tools — agenda\'s, CRM\'s, betaalsystemen, WhatsApp, e-mail en meer.':
      'Almost always. Via n8n we connect hundreds of tools — calendars, CRMs, payment systems, WhatsApp, email and more.',
    'Wat als er iets misgaat in een workflow?': 'What if something goes wrong in a workflow?',
    'We monitoren alles. Bij een fout krijg je (en wij) een melding, en we lossen het op voordat het impact heeft op je klanten.':
      'We monitor everything. If an error occurs, you (and we) get an alert, and we fix it before it affects your customers.',
    'Kan ik klein beginnen?': 'Can I start small?',
    'Zeker. Veel klanten starten met één workflow — bijvoorbeeld lead-opvolging — en breiden uit zodra ze het resultaat zien.':
      'Sure. Many clients start with one workflow — lead follow-up, for example — and expand once they see the result.',
    'Klaar om werk': 'Ready to take work', 'van je bord te halen?': 'off your plate?',
    'Plan een gratis gesprek van 30 minuten. We brengen samen in kaart welke workflows jou het meeste tijd en omzet opleveren.':
      'Book a free 30-minute call. We map out together which workflows save you the most time and revenue.',
  });
})();

/* ---- site.js (GoHighLevel-adapted) ---- */
(function () {
  /* ───────────────────────────────────────────────────────────────────────
     CONFIG — edit this block for your GoHighLevel setup.
     ─────────────────────────────────────────────────────────────────────── */

  // GoHighLevel booking popup. Two ways to wire it up — fill in ONE:
  //
  // 1) Native GHL popup (recommended, same approach as the previous site).
  //    Add a Popup element in the GHL builder, then paste its wrapper ID
  //    here as a CSS selector, e.g. '#hl_main_popup-pFNF9bw_wM'. "Plan een
  //    gesprek" buttons will reveal that popup directly (no iframe of ours
  //    involved — whatever you put inside the GHL popup is what shows).
  const GHL_POPUP_SELECTOR = '#hl_main_popup-pFNF9bw_wM';
  //
  // 2) Fallback: a raw booking-widget URL, shown in our own overlay+iframe.
  //    Only used if GHL_POPUP_SELECTOR above is empty or not found on the
  //    page. Example:
  //   const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/XXXXXXXX';
  const GHL_BOOKING_URL = '';
  //
  // If neither is set/found, buttons fall back to the contact page instead.

  // Page slugs — must match the actual URL of each page you create in GHL.
  // Edit the right-hand values if you used different slugs; everything
  // else (nav, footer, internal links, active-link highlight) reads from
  // this object so you only need to change it in one place.
  const PAGES = {
    home:              '/',
    diensten:          '/diensten',
    ai_chatbots:       '/ai-chatbots',
    ai_voice_agents:   '/ai-voice-agents',
    ai_automatisering: '/ai-automatisering',
    websites:          '/websites',
    over_ons:          '/over-ons',
    contact:           '/contact',
  };
  const BOOKING_FALLBACK = PAGES.contact;

  // Logo shown in the nav/footer/loader/popup — your GHL Media Library URL.
  const LOGO_URL = 'https://assets.cdn.filesafe.space/2tBkltDEdjuF6a2ULx8o/media/6a3c1e06b3c8655da2a49da3.png';

  const NAV = `
  <div class="nav">
    <div class="wrap">
      <nav class="nav-bar">
        <span class="em-chip nav-em"><img class="em-img" src="${LOGO_URL}" alt="EM Launchpad" /></span>
        <span class="nav-word">Launchpad</span>
        <span class="nav-div"></span>
        <div class="nav-links">
          <a href="${PAGES.home}" data-nav="home">home</a>
          <a href="${PAGES.diensten}" data-nav="diensten">diensten</a>
          <a href="#" data-nav="blog">blog</a>
          <a href="${PAGES.over_ons}" data-nav="over_ons">over_ons</a>
          <a href="${PAGES.contact}" data-nav="contact">contact</a>
        </div>
        <span class="nav-spacer"></span>
        <div class="lang-pick" data-no-i18n="" role="group" aria-label="Taal / Language">
          <button data-setlang="nl">NL</button><button data-setlang="fr">FR</button><button data-setlang="en">EN</button>
        </div>
        <a href="#" class="nav-demo">gratis_demo <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></a>
        <a href="${PAGES.contact}" data-book class="btn-grad-border">plan_een_gesprek <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
      </nav>
    </div>
  </div>`;

  const FOOTER = `
  <footer class="foot">
    <div class="foot-hair"></div>
    <div class="wrap">
      <div class="foot-inner">
        <div class="foot-top">
          <div class="foot-id">
            <div class="foot-lock"><span class="em-chip"><img class="em-img" src="${LOGO_URL}" alt="EM Launchpad" /></span><span class="word">Launchpad</span></div>
            <span class="foot-status"><span class="dot"></span>all_systems_online // 24/7</span>
            <p class="foot-tag">Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.</p>
          </div>
          <div class="foot-news">
            <span class="lbl">// nieuwsbrief</span>
            <form class="foot-field" onsubmit="return false;">
              <input type="email" placeholder="jouw@email.be" aria-label="E-mailadres" />
              <button type="submit">subscribe <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
            </form>
            <div class="foot-social">
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg></a>
              <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8a4.8 4.8 0 01-1-.1V9a7.9 7.9 0 01-4.6-1.5v6.9a5.4 5.4 0 11-5.4-5.4c.2 0 .4 0 .6.05v2.6a2.9 2.9 0 00-.6-.07 2.8 2.8 0 102.8 2.8V2h2.6a4.8 4.8 0 004.8 4.3z"/></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
              <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.7-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg></a>
            </div>
          </div>
        </div>
        <div class="foot-grid">
          <div class="foot-cell">
            <h5 class="foot-h">// <b>diensten</b></h5>
            <div class="foot-links">
              <a href="${PAGES.diensten}">ai chatbots</a><a href="${PAGES.diensten}">ai voice agents</a>
              <a href="${PAGES.diensten}">websites</a><a href="${PAGES.diensten}">ai-automatisering</a>
              <a href="${PAGES.diensten}">reputatiebeheer</a><a href="${PAGES.diensten}">crm &amp; dashboard</a>
              <a href="${PAGES.diensten}">email &amp; sms</a><a href="${PAGES.diensten}">funnels &amp; landingspagina's</a>
            </div>
          </div>
          <div class="foot-cell one">
            <h5 class="foot-h">// <b>bedrijf</b></h5>
            <div class="foot-links">
              <a href="${PAGES.home}">home</a><a href="${PAGES.diensten}">diensten</a><a href="${PAGES.over_ons}">over_ons</a>
              <a href="#">live_demo</a><a href="#">blog</a><a href="${PAGES.contact}">contact</a>
            </div>
          </div>
          <div class="foot-cell">
            <h5 class="foot-h">// <b>contact</b></h5>
            <div class="foot-contact">
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Brugstraat 2A, 3870 Vechmaal, België</span></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg><a href="tel:+32476015451">+32&nbsp;476&nbsp;01&nbsp;54&nbsp;51</a></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg><a href="mailto:ebert@emlaunchpad.com">ebert@emlaunchpad.com</a></div>
            </div>
          </div>
        </div>
        <div class="foot-cities">
          <p class="lead2">// lokaal_actief →</p>
          <a href="#">Hasselt</a><span class="sep">/</span><a href="#">Tongeren</a><span class="sep">/</span><a href="#">Sint-Truiden</a><span class="sep">/</span><a href="#">Genk</a><span class="sep">/</span><a href="#">Bilzen</a><span class="sep">/</span><a href="#">Maaseik</a><span class="sep">/</span><a href="#">Heel Limburg &amp; België</a>
        </div>
        <div class="foot-bot">
          <span>© 2026 <b>EM_LAUNCHPAD</b> · BTW BE1024.977.818</span>
          <span><span class="mint">▲</span> <b>GEMAAKT_IN_LIMBURG</b> · BELGIË</span>
        </div>
      </div>
    </div>
  </footer>`;

  // Inject chrome into mount points
  const navMount = document.getElementById('nav-mount');
  if (navMount) navMount.outerHTML = NAV;
  const footMount = document.getElementById('footer-mount');
  if (footMount) footMount.outerHTML = FOOTER;

  // Active nav link — derived from the URL path. GHL controls <body> on
  // its own pages, so (unlike the original flat-file site) we can't read a
  // data-page attribute from it; the path is the only reliable signal.
  (function () {
    const norm = (p) => (p || '/').replace(/\/+$/, '') || '/';
    const path = norm(location.pathname);
    const SERVICE_DETAIL = [PAGES.ai_chatbots, PAGES.ai_voice_agents, PAGES.ai_automatisering, PAGES.websites].map(norm);
    let page = SERVICE_DETAIL.includes(path) ? 'diensten' : null;
    if (!page) {
      for (const key of ['home', 'diensten', 'over_ons', 'contact']) {
        if (norm(PAGES[key]) === path) { page = key; break; }
      }
    }
    document.querySelectorAll('.nav-links a[data-nav]').forEach((a) => {
      if (a.dataset.nav === page) a.classList.add('active');
    });
  })();

  // Apply site-wide language (switcher lives in the nav)
  if (window.EMi18n) window.EMi18n.init();

  // Loader — plays only on the FIRST entry to the site (per browser session).
  // On any later page within the same session it's removed instantly.
  (function () {
    const loader = document.getElementById('loader');
    if (!loader) return;
    let seen = false;
    try { seen = sessionStorage.getItem('em_loaded') === '1'; } catch (e) {}
    if (seen) { loader.remove(); return; }
    try { sessionStorage.setItem('em_loaded', '1'); } catch (e) {}
    const msg = document.getElementById('loaderMsg');
    const steps = ['systemen initialiseren', 'agenda koppelen', 'ai laden', 'klaar'];
    let s = 0;
    const tick = setInterval(() => { s = Math.min(s + 1, steps.length - 1); if (msg) msg.textContent = steps[s]; }, 420);
    const finish = () => {
      clearInterval(tick); if (msg) msg.textContent = 'klaar';
      setTimeout(() => { loader.classList.add('done'); setTimeout(() => loader.remove(), 650); }, 520);
    };
    if (document.readyState === 'complete') setTimeout(finish, 1400);
    else window.addEventListener('load', () => setTimeout(finish, 800));
  })();

  // Page transitions — smooth cross-fade + gradient sweep when navigating
  // to another internal page (instead of an instant jump).
  (function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const norm = (p) => (p || '/').replace(/\/+$/, '') || '/';
    const isInternal = (a) => {
      if (!a) return false;
      if (a.target === '_blank' || a.hasAttribute('download')) return false;
      const href = a.getAttribute('href') || '';
      if (!href || href[0] === '#') return false;
      if (/^(mailto:|tel:|https?:|\/\/)/i.test(href)) return false;
      return href[0] === '/'; // root-relative GHL page paths, e.g. "/contact"
    };
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!isInternal(a)) return;
      if (a.hasAttribute('data-book')) return; // booking CTAs open the popup instead
      const href = a.getAttribute('href');
      // same page? let the browser handle the in-page anchor
      if (norm(href.split('#')[0]) === norm(location.pathname)) return;
      e.preventDefault();
      if (reduce) { window.location.href = href; return; }
      const bar = document.createElement('div');
      bar.className = 'pt-bar';
      document.body.appendChild(bar);
      void bar.offsetWidth; bar.classList.add('go');
      document.body.classList.add('pt-leaving');
      setTimeout(() => { window.location.href = href; }, 330);
    });
    // restore on back/forward (bfcache) so the page isn't left faded out
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('pt-leaving');
      const b = document.querySelector('.pt-bar'); if (b) b.remove();
    });
  })();

  // FAQ accordion (any page with .faq-item)
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll progress bar (top of page)
  (function () {
    const bar = document.createElement('div');
    bar.className = 'scroll-prog';
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
      bar.style.width = (p * 100) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  // Nav condense on scroll
  (function () {
    const onScroll = () => { document.body.classList.toggle('is-scrolled', (window.scrollY || 0) > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // Reveal-on-scroll (staggered) — opt-in via [data-reveal]
  if (!reduceMotion) {
    document.documentElement.classList.add('reveal-ready');
    // stagger children inside [data-reveal-group]
    document.querySelectorAll('[data-reveal-group]').forEach((grp) => {
      [...grp.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => {
        el.style.transitionDelay = (i * 75) + 'ms';
      });
    });
    const all = [...document.querySelectorAll('[data-reveal]')];
    const reveal = (el) => el.classList.add('in');
    // 1) reveal anything already in (or above) the viewport immediately
    const initPass = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      all.forEach((el) => { if (el.classList.contains('in')) return; if (el.getBoundingClientRect().top < vh * 0.96) reveal(el); });
    };
    // 2) observe the rest for staggered reveal on scroll
    let obs = null;
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
      all.forEach((el) => obs.observe(el));
    }
    initPass();
    // 3) safety fallbacks — content must never stay hidden
    const revealAll = () => all.forEach(reveal);
    window.addEventListener('load', () => { initPass(); setTimeout(revealAll, 1600); });
    setTimeout(initPass, 200);
    setTimeout(revealAll, 2600);
    // also catch in-view items as the user scrolls, even if the observer is flaky
    window.addEventListener('scroll', initPass, { passive: true });
  }

  // Lightweight parallax — opt-in via [data-parallax="<speed>"]
  if (!reduceMotion) {
    const items = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
      el, speed: parseFloat(el.dataset.parallax) || 0.12,
      scale: el.dataset.parallaxScale ? parseFloat(el.dataset.parallaxScale) : 0,
    }));
    if (items.length) {
      let ticking = false;
      const update = () => {
        const y = window.scrollY || 0;
        items.forEach((it) => {
          const sc = it.scale ? ' scale(' + (1 - Math.min(y * it.scale, 0.12)) + ')' : '';
          it.el.style.transform = 'translate3d(0,' + (y * it.speed).toFixed(1) + 'px,0)' + sc;
        });
        ticking = false;
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
  }

  // ── GoHighLevel booking popup ────────────────────────────────────────────
  (function () {
    let overlay = null, lastFocus = null;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'ghl-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Plan een gesprek');
      overlay.innerHTML =
        '<div class="ghl-modal">' +
          '<div class="ghl-head">' +
            '<span class="em-chip"><img class="em-img" src="' + LOGO_URL + '" alt="EM Launchpad" /></span>' +
            '<span class="ttl"><b>Plan een gratis gesprek</b><span><span class="dot"></span>30 min · vrijblijvend</span></span>' +
            '<button class="ghl-close" type="button" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
          '<div class="ghl-body"><div class="ghl-loading"><span class="spin"></span></div></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
      overlay.querySelector('.ghl-close').addEventListener('click', closePopup);
    }

    function nativePopup() {
      return GHL_POPUP_SELECTOR ? document.querySelector(GHL_POPUP_SELECTOR) : null;
    }

    window.openPopup = function () {
      // 1) Native GHL popup — same concept as the previous site: just reveal
      // its existing DOM node, GHL's own popup handles everything else.
      const native = nativePopup();
      if (native) { native.style.display = 'block'; return; }

      // 2) Fallback: our own overlay + iframe around GHL_BOOKING_URL.
      if (!GHL_BOOKING_URL) { window.location.href = BOOKING_FALLBACK; return; }
      if (!overlay) build();
      const body = overlay.querySelector('.ghl-body');
      if (!body.querySelector('iframe')) {
        const f = document.createElement('iframe');
        f.src = GHL_BOOKING_URL;
        f.title = 'Plan een gesprek';
        f.loading = 'lazy';
        f.setAttribute('scrolling', 'yes');
        f.allow = 'payment';
        f.addEventListener('load', () => { const l = body.querySelector('.ghl-loading'); if (l) l.style.display = 'none'; });
        body.appendChild(f);
      }
      lastFocus = document.activeElement;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => overlay.querySelector('.ghl-close').focus(), 60);
    };

    window.closePopup = function () {
      const native = nativePopup();
      if (native) native.style.display = 'none';
      if (!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (nativePopup() || (overlay && overlay.classList.contains('open')))) closePopup();
    });

    // Any [data-book] link/button opens the popup (capture phase so it wins
    // over the page-transition handler).
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('[data-book]');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      window.openPopup();
    }, true);
  })();
})();
