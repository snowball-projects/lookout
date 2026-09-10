"""Check the static document structure and required application mount points."""
from html.parser import HTMLParser
from pathlib import Path

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.ids=set()
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids: raise ValueError('Duplicate element ID: '+attrs['id'])
            self.ids.add(attrs['id'])
        if tag not in VOID: self.stack.append(tag)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self,tag):
        if not self.stack or self.stack.pop()!=tag: raise ValueError('Unbalanced HTML at '+tag)

p=Document();p.feed((Path(__file__).resolve().parents[1]/'web/index.html').read_text())
if p.stack: raise ValueError('Unclosed HTML elements')
required=set('main content notice dataset crumb export import file demo clear info about'.split())
if not required<=p.ids: raise ValueError('Missing app mount points: '+str(required-p.ids))
print('Static document structure verified')
