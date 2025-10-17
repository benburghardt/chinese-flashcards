# Data Source Licenses

This document provides detailed licensing information for all Chinese language datasets 
used in this application. **These datasets are NOT included in this repository** and 
must be downloaded separately by users.

---

## CC-CEDICT

### Overview
A community-maintained free Chinese-English dictionary with over 120,000 entries.

### Source Information
- **Website:** https://www.mdbg.net/chinese/dictionary?page=cedict
- **Project Wiki:** https://cc-cedict.org/wiki/
- **Download:** https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz

### Copyright
© MDBG and CC-CEDICT contributors

### License
Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

**Full license text:** See `LICENSES/CC-BY-SA-4.0.txt` or visit  
https://creativecommons.org/licenses/by-sa/4.0/

### License Summary
You are free to:
- ✅ **Share** — copy and redistribute the material in any medium or format
- ✅ **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original

### Our Usage
- Data has been parsed and imported into a SQLite database
- No modifications to dictionary entries themselves
- Used for character definitions, pinyin pronunciation, and word meanings

### Attribution Required
```
CC-CEDICT © MDBG
https://www.mdbg.net/chinese/dictionary?page=cedict
Licensed under CC BY-SA 4.0
```

---

## SUBTLEX-CH

### Overview
Chinese word and character frequency data based on analysis of 46.8 million characters 
from film and television subtitles.

### Source Information
- **Website:** https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch
- **Download:** Available from the website above (registration may be required)

### Copyright
© 2010 Qing Cai and Marc Brysbaert, Ghent University

### License
Free for research and educational purposes

**License terms:** The dataset is freely available for non-commercial research and 
educational use. Commercial use requires permission from the authors.

**Full citation requirements:** See `LICENSES/SUBTLEX-CH-Citation.txt`

### License Summary
You are free to:
- ✅ Use for non-commercial research
- ✅ Use for educational purposes
- ⚠️ Commercial use requires author permission

### Required Citation
When using this data, you **must** cite the original paper:

```
Cai, Q., & Brysbaert, M. (2010). SUBTLEX-CH: Chinese Word and Character 
Frequencies Based on Film Subtitles. PLoS ONE, 5(6), e10729.
https://doi.org/10.1371/journal.pone.0010729
```

### Our Usage
- Frequency rankings used to determine learning order
- Data has been processed and integrated into application database
- Used for prioritizing common characters and words
- **This application is non-commercial and educational** ✅

### Attribution Required
Include citation in app documentation and "About" section (see above).

---

## Make Me a Hanzi

### Overview
Stroke order data, character decomposition, and vector graphics for 9,000+ Chinese characters.

### Source Information
- **Repository:** https://github.com/skishore/makemeahanzi
- **Website:** https://www.skishore.me/makemeahanzi
- **Download:** Clone repository or download releases

### Copyright
- **Dictionary data (dictionary.txt):** Derived from Unihan database and other sources
- **Graphics data (graphics.txt, SVG files):** © 2016 Shaunak Kishore
- **Original font data:** © Arphic Technology, Co., Ltd.

### License
This project has a **dual license** depending on which files you use:

#### Dictionary Data (dictionary.txt)
**License:** Arphic Public License

**Full license text:** See `LICENSES/Arphic-Public-License.txt` or  
https://github.com/skishore/makemeahanzi/blob/master/COPYING

**Summary:**
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ Must include copyright notice and license
- ✅ Must provide source code for modifications

#### Graphics Data (graphics.txt, SVG files)
**License:** GNU Lesser General Public License (LGPL) version 2.1 or later

**Full license text:** See `LICENSES/LGPL-2.1.txt` or  
https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

**Summary:**
- ✅ Free to use in both open and proprietary software
- ✅ Commercial use allowed
- ✅ If you modify the graphics files themselves, you must share those modifications under LGPL
- ✅ If you just use the graphics (without modifying them), your application can use any license

### Our Usage
- Dictionary data used for character decomposition and etymology
- Graphics data (SVG paths) used for stroke order animations
- SVG files displayed in writing practice mode
- **We are using the graphics without modification** (no LGPL obligations on our code)

### Attribution Required
```
Make Me a Hanzi © 2016 Shaunak Kishore
Original font data © Arphic Technology
https://github.com/skishore/makemeahanzi

Dictionary data: Arphic Public License
Graphics data: LGPL 2.1+
```

---

## CC-Canto

### Overview
Cantonese pronunciation data (Jyutping romanization) for traditional Chinese characters.

### Source Information
- **Website:** https://cantonese.org/
- **Download:** Available from website (check for download options)

### Copyright
© CC-Canto contributors

### License
Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

**Full license text:** See `LICENSES/CC-BY-SA-4.0.txt` or visit  
https://creativecommons.org/licenses/by-sa/4.0/

### License Summary
Same terms as CC-CEDICT (see above)

### Our Usage
- Cantonese Jyutping pronunciation data
- Integrated with traditional character data in database
- Used for Cantonese learning mode

### Attribution Required
```
CC-Canto © CC-Canto contributors
https://cantonese.org/
Licensed under CC BY-SA 4.0
```

---

## Unicode Han Database (Unihan) - Reference

### Overview
While not directly used as a dataset, the Unihan database informs some of the character 
data in our sources (particularly Make Me a Hanzi).

### Source Information
- **Website:** https://unicode.org/charts/unihan.html
- **Documentation:** https://www.unicode.org/reports/tr38/

### License
Unicode License (permissive, similar to MIT)

**Summary:** Free to use for any purpose with attribution to Unicode, Inc.

---

## Summary Table

| Dataset | License | Commercial Use | Attribution Required | ShareAlike Required |
|---------|---------|----------------|---------------------|---------------------|
| CC-CEDICT | CC BY-SA 4.0 | ✅ Yes | ✅ Yes | ✅ Yes |
| SUBTLEX-CH | Academic/Educational | ⚠️ Need permission | ✅ Yes (citation) | ❌ No |
| Make Me a Hanzi (Dict) | Arphic Public | ✅ Yes | ✅ Yes | ✅ Yes |
| Make Me a Hanzi (Graphics) | LGPL 2.1+ | ✅ Yes | ✅ Yes | ⚠️ Only if modified |
| CC-Canto | CC BY-SA 4.0 | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Compliance Checklist

To comply with all licenses, this application must:

- [x] Include this DATA-LICENSES.md file
- [x] Include full license texts in LICENSES/ directory
- [x] Attribute all data sources in CREDITS.md
- [x] Display credits in application "About" screen
- [x] Cite SUBTLEX-CH paper in documentation
- [x] Not remove copyright notices from any data
- [x] Not impose additional restrictions on data
- [x] Keep application non-commercial (due to SUBTLEX-CH)
- [x] Share this combined work under compatible license

---

## For Users and Developers

### If you use this application:
- You benefit from multiple open-source datasets
- You must respect the licenses of the data sources
- You should understand this is for educational purposes only

### If you fork or modify this code:
- Your derived work must also comply with all data licenses
- You must maintain all attribution and license files
- If you modify Make Me a Hanzi graphics, share those modifications under LGPL
- Keep the application non-commercial or obtain permission from SUBTLEX-CH authors

### If you want to use the data separately:
- Download directly from original sources
- Follow each dataset's individual license terms
- This application doesn't grant any additional rights to the underlying data

---

## Questions or Concerns?

If you have questions about licensing, believe there is an error in this document, 
or need clarification about data usage rights, please:

1. Review the full license texts in the `LICENSES/` directory
2. Consult the original data source websites
3. Open an issue on our GitHub repository
4. Contact the original data maintainers if needed

---

## License Changes and Updates

This document reflects the licensing status as of October 2025. License terms for 
external datasets may change over time. Always verify current license terms at the 
original source websites.

**Last updated:** October 2025  
**Last verified:** October 2025

---

*This application is committed to respecting intellectual property rights and properly 
attributing all sources. We believe in supporting the open-source and open-data communities 
that make projects like this possible.*
