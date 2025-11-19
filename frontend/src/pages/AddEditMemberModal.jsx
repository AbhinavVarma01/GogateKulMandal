import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CustomSelect } from '../components/ui/select';
import { User, Calendar, MapPin, Heart, Users, Phone, Mail, Briefcase, GraduationCap, Camera, FileText } from 'lucide-react';

export function AddEditMemberModal({ isOpen, onClose, onSave, member, title }) {
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    middleName: '',
    nickname: '',
    
    // Personal Details
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    status: 'living',
    gender: '',
    maritalStatus: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    
    // Family Relations
    relationship: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    children: [],
    
    // Professional Information
    occupation: '',
    company: '',
    education: '',
    degree: '',
    
    // Additional Information
    notes: '',
    profileImage: '',
    documents: []
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (member) {
      const fullName = member.name || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName || '');
      const nameParts = fullName.split(' ');
      
      setFormData({
        firstName: member.firstName || nameParts[0] || '',
        lastName: member.lastName || nameParts[nameParts.length - 1] || '',
        middleName: member.middleName || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''),
        nickname: member.nickname || member.nick || '',
        birthDate: member.birthDate || member.dateOfBirth || member.dob || '',
        birthPlace: member.birthPlace || member.birthLocation || '',
        deathDate: member.deathDate || member.dateOfDeath || '',
        deathPlace: member.deathPlace || member.deathLocation || '',
        status: member.status || member.livingStatus || 'living',
        gender: member.gender || '',
        maritalStatus: member.maritalStatus || member.marital || '',
        email: member.email || '',
        phone: member.phone || member.phoneNumber || '',
        address: member.address || member.location || member.place || '',
        city: member.city || '',
        state: member.state || member.province || '',
        country: member.country || '',
        zipCode: member.zipCode || member.postalCode || '',
        relationship: member.relationship || member.relation || '',
        fatherName: member.fatherName || member.father || '',
        motherName: member.motherName || member.mother || '',
        spouseName: member.spouseName || member.spouse || '',
        children: member.children || [],
        occupation: member.occupation || member.job || member.profession || '',
        company: member.company || member.workplace || '',
        education: member.education || member.school || '',
        degree: member.degree || member.qualification || '',
        notes: member.notes || member.description || member.bio || '',
        profileImage: member.profileImage || member.image || member.photo || '',
        documents: member.documents || []
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        nickname: '',
        birthDate: '',
        birthPlace: '',
        deathDate: '',
        deathPlace: '',
        status: 'living',
        gender: '',
        maritalStatus: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        relationship: '',
        fatherName: '',
        motherName: '',
        spouseName: '',
        children: [],
        occupation: '',
        company: '',
        education: '',
        degree: '',
        notes: '',
        profileImage: '',
        documents: []
      });
    }
    setErrors({});
  }, [member, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.birthDate && formData.deathDate && new Date(formData.birthDate) > new Date(formData.deathDate)) {
      newErrors.deathDate = 'Death date cannot be before birth date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Combine first, middle, and last name for the name field
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');
      
      const memberData = {
        ...formData,
        name: fullName,
        // Create a display name with nickname if available
        displayName: formData.nickname ? `${fullName} (${formData.nickname})` : fullName
      };
      
      onSave(memberData);
    onClose();
    }
  };

  const relationships = [
    'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister',
    'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
    'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin', 'Spouse',
    'Father-in-law', 'Mother-in-law', 'Son-in-law', 'Daughter-in-law',
    'Brother-in-law', 'Sister-in-law', 'Stepfather', 'Stepmother',
    'Stepson', 'Stepdaughter', 'Half-brother', 'Half-sister'
  ];

  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Engaged'];

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'personal', label: 'Personal', icon: Heart },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'additional', label: 'Additional', icon: FileText }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
  return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" />
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className={`${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-3 block">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className={`${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                <Label htmlFor="middleName" className="text-sm font-medium text-gray-700 mb-3 block">Middle Name</Label>
            <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="Enter middle name"
            />
          </div>
          
          <div>
                <Label htmlFor="nickname" className="text-sm font-medium text-gray-700 mb-3 block">Nickname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Enter nickname"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationship" className="text-sm font-medium text-gray-700 mb-3 block">Relationship to Family</Label>
              <CustomSelect 
              value={formData.relationship} 
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                placeholder="Select relationship"
            >
                {relationships.map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </CustomSelect>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  Birth Date
                </Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          <div>
                <Label htmlFor="birthPlace" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" />
                  Birth Place
                </Label>
            <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  placeholder="City, State, Country"
                />
              </div>
            </div>

            {formData.status === 'deceased' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deathDate" className="text-sm font-medium text-gray-700 mb-3 block">Death Date</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    className={errors.deathDate ? 'border-red-500' : ''}
                  />
                  {errors.deathDate && <p className="text-red-500 text-xs mt-1">{errors.deathDate}</p>}
          </div>

          <div>
                  <Label htmlFor="deathPlace" className="text-sm font-medium text-gray-700 mb-3 block">Death Place</Label>
                  <Input
                    id="deathPlace"
                    value={formData.deathPlace}
                    onChange={(e) => setFormData({ ...formData, deathPlace: e.target.value })}
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-3 block">Status</Label>
                <CustomSelect 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
                  placeholder="Select status"
                >
                  <option value="living">Living</option>
                  <option value="deceased">Deceased</option>
                </CustomSelect>
              </div>
              
              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-3 block">Gender</Label>
                <CustomSelect 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  placeholder="Select gender"
                >
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </CustomSelect>
              </div>
              
              <div>
                <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700 mb-3 block">Marital Status</Label>
                <CustomSelect 
                  value={formData.maritalStatus} 
                  onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                  placeholder="Select status"
                >
                  {maritalStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </CustomSelect>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-3 block">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-3 block">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-700 mb-3 block">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State or Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-3 block">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country name"
                />
              </div>
              
              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700 mb-3 block">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="ZIP or Postal Code"
                />
              </div>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fatherName" className="text-sm font-medium text-gray-700 mb-3 block">Father's Name</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Father's full name"
                />
              </div>
              
              <div>
                <Label htmlFor="motherName" className="text-sm font-medium text-gray-700 mb-3 block">Mother's Name</Label>
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Mother's full name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="spouseName" className="text-sm font-medium text-gray-700 mb-3 block">Spouse's Name</Label>
              <Input
                id="spouseName"
                value={formData.spouseName}
                onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                placeholder="Spouse's full name"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Children</Label>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">Children information will be managed through the family tree relationships.</p>
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="occupation" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4" />
                  Occupation
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="Job title or profession"
                />
              </div>
              
              <div>
                <Label htmlFor="company" className="text-sm font-medium text-gray-700 mb-3 block">Company/Organization</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company or organization name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="education" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4" />
                  Education
                </Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="School or university name"
                />
              </div>
              
              <div>
                <Label htmlFor="degree" className="text-sm font-medium text-gray-700 mb-3 block">Degree/Qualification</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="Degree or qualification"
                />
              </div>
            </div>
          </div>
        );

      case 'additional':
        return (
          <div className="space-y-8 max-w-3xl mx-auto pb-8">
            <div>
              <Label htmlFor="profileImage" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4" />
                Profile Image URL
              </Label>
              <Input
                id="profileImage"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-3 block">Notes & Additional Information</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes, memories, or information about this family member..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 bg-orange-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto relative flex items-center justify-center bg-gray-50" style={{ minHeight: '400px' }}>
            <div className="w-full max-w-4xl p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderTabContent()}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6"
            >
              {member ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}