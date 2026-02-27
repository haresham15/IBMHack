import zipfile
import xml.etree.ElementTree as ET

def read_docx(path):
    with zipfile.ZipFile(path) as docx:
        tree = ET.fromstring(docx.read('word/document.xml'))
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        return '\n'.join([node.text for node in tree.findall('.//w:t', namespaces) if node.text])

if __name__ == '__main__':
    text = read_docx(r'c:\Users\hares\OneDrive\Desktop\CS_Projects\IBMHack\PRD\Project_Vantage_PRD.docx')
    with open(r'c:\Users\hares\OneDrive\Desktop\CS_Projects\IBMHack\prd_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
